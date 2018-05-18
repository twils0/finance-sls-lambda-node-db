const AWS = require('aws-sdk'); // eslint-disable-line
const awsConfig = require('./aws.config.json');

// ensure that the accessToken provided is still valid
module.exports.testAuth = async (accessToken) => {
  if (!global.cognito) {
    global.cognito = new AWS.CognitoIdentityServiceProvider(awsConfig.cognito);
  }

  const awsPayload = {
    AccessToken: accessToken,
  };

  try {
    await new Promise((resolve, reject) => {
      global.cognito.getUser(awsPayload, (errorCallback, response) => {
        if (errorCallback) {
          reject(errorCallback);
        } else {
          resolve(response);
        }
      });
    });
  } catch (errorCatch) {
    return Promise.reject(errorCatch);
  }

  return null;
};
