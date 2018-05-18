const AWS = require('aws-sdk'); // eslint-disable-line

const awsConfig = require('./aws.config.json');

// sign up a new user in Cognito
module.exports.signUp = async (payload) => {
  if (!global.cognito) {
    global.cognito = new AWS.CognitoIdentityServiceProvider(awsConfig.cognito);
  }

  const awsPayload = {
    ClientId: awsConfig.cognitoSignUp.clientId,
    Username: payload.email,
    Password: payload.password,
    UserAttributes: [
      {
        Name: 'email',
        Value: payload.email,
      },
      {
        Name: 'phone_number',
        Value: payload.phone,
      },
      {
        Name: 'name',
        Value: payload.name,
      },
      {
        Name: 'custom:stripe_customer_id',
        Value: payload.customerId,
      },
      {
        Name: 'custom:user_id',
        Value: payload.userId,
      },
    ],
  };

  try {
    await new Promise((resolve, reject) => {
      global.cognito.signUp(awsPayload, (errorCallback, response) => {
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
