const AWS = require('aws-sdk'); // eslint-disable-line

const sesConfig = require('./ses.config.json');

// used to forward tickerCusip emails to subscribers;
// please check the ses.config.json for configuration options
module.exports.sendEmail = async (email, emailAddresses) => {
  // keep as a global variable, to avoid
  // reloading for each call to a lambda instance
  if (!global.ses) {
    global.ses = new AWS.SES();
  }

  const {
    fromEmail, fromDomain, subject, body,
  } = email;
  const newSubject = `${sesConfig.subjectPrefix}${subject}`;
  const from = `${sesConfig.fromName} <${sesConfig.fromVerifiedEmail}>`;

  const params = {
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: newSubject,
      },
      Body: null,
    },
    Source: from,
    ReplyToAddresses: [from],
  };

  if (!body) {
    console.log('Email Not Sent - no body provided');
  } else if (
    sesConfig.validEmails.indexOf(fromEmail) === -1 &&
    sesConfig.validDomains.indexOf(fromDomain) === -1
  ) {
    console.log('Email Not Sent - invalid fromEmail and fromDomain');
  } else if (
    !emailAddresses ||
    typeof emailAddresses !== 'object' ||
    emailAddresses.constructor !== Array ||
    emailAddresses.length === 0
  ) {
    console.log('Email Not Sent - no email addresses provided');
  } else {
    params.Message.Body = {
      Text: {
        Charset: 'UTF-8',
        Data: body,
      },
    };

    emailAddresses.forEach(async (address) => {
      try {
        await new Promise((resolve, reject) => {
          const sendEmailParams = { ...params, Destination: { ToAddresses: [address] } };

          global.ses.sendEmail(sendEmailParams, (errorCallback, result) => {
            if (errorCallback) {
              reject(errorCallback);
            }
            resolve(result);
          });
        });
      } catch (errorCatch) {
        console.log(`unexpected error - failed to send email - ${address}`, '\n', errorCatch);
      }
    });
  }

  return null;
};
