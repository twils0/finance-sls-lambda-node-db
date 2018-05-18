const AWS = require('aws-sdk'); // eslint-disable-line

const sesConfig = require('./ses.config.json');

// used to send verification emails, to verify a new user's
// email address through a link in the email
module.exports.sendTemplatedEmail = async (template, data, emailAddresses) => {
  // keep as a global variable, to avoid
  // reloading for each call to a lambda instance
  if (!global.ses) {
    global.ses = new AWS.SES();
  }

  const from = `${sesConfig.fromName} <${sesConfig.fromVerifiedEmail}>`;
  const replyTo = `${sesConfig.replyToName} <${sesConfig.replyToVerifiedEmail}>`;
  const params = {
    Template: template,
    Source: from,
    ReplyToAddresses: [replyTo],
  };

  if (data) {
    params.TemplateData = JSON.stringify(data);
  } else {
    params.TemplateData = JSON.stringify({});
  }

  if (
    !emailAddresses ||
    typeof emailAddresses !== 'object' ||
    emailAddresses.constructor !== Array ||
    emailAddresses.length === 0
  ) {
    console.log('email not sent - no email addresses provided');
  } else {
    emailAddresses.forEach(async (address) => {
      try {
        await new Promise((resolve, reject) => {
          const emailParams = { ...params, Destination: { ToAddresses: [address] } };

          global.ses.sendTemplatedEmail(emailParams, (errorCallback, result) => {
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
