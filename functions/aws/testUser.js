const AWS = require('aws-sdk'); // eslint-disable-line

const awsConfig = require('./aws.config.json');

// make sure the user's username (email) isn't
// already in use in Cognito
module.exports.testUser = async (email, userId) => {
  if (!global.cognito) {
    global.cognito = new AWS.CognitoIdentityServiceProvider(awsConfig.cognito);
  }

  const awsPayload = {
    UserPoolId: awsConfig.cognito.userPoolId,
    Username: email,
  };

  try {
    await new Promise((resolve, reject) => {
      global.cognito.adminGetUser(awsPayload, (errorCallback, response) => {
        if (errorCallback && errorCallback.code === 'UserNotFoundException') {
          resolve();
        } else if (errorCallback) {
          reject(errorCallback);
        } else if (userId) {
          response.UserAttributes.forEach((attribute) => {
            if (attribute.Name === 'custom:user_id') {
              if (attribute.Value === userId) {
                resolve();
              } else {
                reject({
                  code: 'UsernameExistsException',
                  message: 'This email is already in use',
                });
              }
            }
          });
        } else {
          reject({
            code: 'UsernameExistsException',
            message: 'This email is already in use',
          });
        }
      });
    });
  } catch (errorCatch) {
    return Promise.reject(errorCatch);
  }

  return null;
};
