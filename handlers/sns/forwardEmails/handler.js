const sesConfig = require('../../../functions/aws/ses/ses.config.json');

const { loadPool } = require('../../../functions/db/loadPool');
const { parseS3SNSEvent } = require('../../../functions/aws/ses/parseS3SNSEvent');
const { parseEmailBody } = require('../../../functions/aws/ses/parseEmailBody');
const { getEmailAddresses } = require('../../../functions/db/getEmailAddresses');
const { sendEmail } = require('../../../functions/aws/ses/sendEmail');
const { errorResponse } = require('../../../functions/errorResponse');

// forward emails to subscribers; look for a line starting with
// 'Symbol:' and ending with a valid tickerCusip; find the email
// and emailAdditional of all subscribers to that tickerCusip and
// send an email to all email addresses found, with the previous
// email's body, the previous email's subject with a prefix added,
// and new 'from' and 'replyTo' email addresses
module.exports.forwardEmails = async (event, context, callback) => {
  let error = null;

  try {
    console.log('loadPool\n');

    await loadPool();
  } catch (errorCatch) {
    error = errorCatch;
  }

  let fromEmail = null;
  let fromDomain = null;
  let subject = null;
  let bucketParams = null;
  let tickerCusip = null;
  let body = null;
  let emailAddresses = [];

  if (!error) {
    try {
      console.log('parseS3SNSEvent\n');

      ({
        fromEmail, fromDomain, subject, bucketParams,
      } = await parseS3SNSEvent(event));
    } catch (errorCatch) {
      error = errorCatch;
    }
  }

  if (
    !error &&
    (!fromEmail ||
      !fromDomain ||
      (sesConfig.validEmails.indexOf(fromEmail) === -1 &&
        sesConfig.validDomains.indexOf(fromDomain) === -1))
  ) {
    error = 'unexpected error - missing or invalid fromEmail and/or fromDomain';
  }

  if (!error) {
    try {
      console.log('parseEmailBody\n');

      ({ tickerCusip, body } = await parseEmailBody(bucketParams));
    } catch (errorCatch) {
      error = errorCatch;
    }
  }

  if (!error) {
    try {
      console.log('getEmailAddresses\n', tickerCusip, '\n');

      ({ emailAddresses } = await getEmailAddresses(tickerCusip));

      console.log(
        'Email Received',
        '\nFrom Email: ',
        fromEmail,
        '\nFrom Domain: ',
        fromDomain,
        '\nTicker/Cusip: ',
        tickerCusip,
        '\nEmail Addresses: ',
        emailAddresses,
      );
    } catch (errorCatch) {
      error = errorCatch;
    }
  }

  if (!error) {
    try {
      await sendEmail(
        {
          fromEmail,
          fromDomain,
          subject,
          body,
        },
        emailAddresses,
      );
    } catch (errorCatch) {
      error = errorCatch;
    }
  }

  let errorRes = null;

  if (error) {
    errorRes = errorResponse(error);
  }

  const response = {
    status: 200,
    body: {
      message: 'success',
    },
  };

  callback(errorRes, response);
};
