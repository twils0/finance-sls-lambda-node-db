const AWS = require('aws-sdk'); // eslint-disable-line

// parse the email body of a message; look for a line starting
// with 'Symbol:', the remainder of the line should designate
// a tickerCusip; return the desginated tickerCusip and the
// body of the email, to be forwarded to all subscribers of
// the tickerCusip
module.exports.parseEmailBody = async (bucketParams) => {
  // keep as a global variable, to avoid
  // reloading for each call to a lambda instance
  if (!global.s3) {
    global.s3 = new AWS.S3();
  }

  let s3Email = null;
  const body = null;
  let tickerCusip = null;

  try {
    s3Email = await new Promise((resolve, reject) => {
      global.s3.getObject(bucketParams, (errorCallback, result) => {
        if (errorCallback) {
          reject(errorCallback);
        } else if (result.Body) {
          resolve(result.Body.toString());
        } else {
          reject('unexpected error - missing s3 get object result body');
        }
      });
    });
  } catch (error) {
    return Promise.reject(error);
  }

  const [, boundaryFind1] = s3Email.split(/^\s*Content-Type: multipart\/alternative;/gm, 2);
  let boundaryFind2 = null;
  let boundary = '';
  let base64 = false;
  let bodySplit3 = '';

  if (boundaryFind1) {
    [, boundaryFind2] = boundaryFind1.split(/boundary="/g, 2);
  }

  if (boundaryFind2) {
    [boundary] = boundaryFind2.split(/"/g, 2);
  }

  const [, bodySplit1] = s3Email.split(/^\s*Content-Type: text\/plain;/gm, 2);

  if (bodySplit1) {
    const [startOfSplit] = bodySplit1.split(/([\n\r][\n\r])$/gm);

    if (startOfSplit) {
      if (startOfSplit.search(/^\s*Content-Transfer-Encoding: base64/gm) > -1) {
        base64 = true;
      }

      const bodySplit2 = bodySplit1.slice(startOfSplit.length);

      if (boundary) {
        [bodySplit3] = bodySplit2.split(`--${boundary}`, 2);
      } else {
        bodySplit3 = bodySplit2;
      }
    }

    bodySplit3 = bodySplit3.replace(/=$[\n\r]/gm, '');

    if (base64) {
      bodySplit3 = bodySplit3.replace(/[\n\r]/g, '');
      bodySplit3 = Buffer.from(bodySplit3, 'base64').toString();
    }

    if (!bodySplit3) {
      return Promise.reject('unexpected error - unable to parse body');
    }

    // parse ticker from email, by looking for the first line
    // starting with "Security:" and expecting the rest of the line
    // to be the ticker
    const [, tickerFind1] = bodySplit3.split(/^\s*Security:\s*/gm, 2);

    if (tickerFind1) {
      [tickerCusip] = tickerFind1.split(/\s+/g, 2);
    }

    if (!tickerCusip) {
      return Promise.reject('unexpected error - unable to parse tickerCusip');
    }
  } else {
    return Promise.reject('unexpected error - text/plain content-type not available');
  }

  return {
    body,
    tickerCusip,
  };
};
