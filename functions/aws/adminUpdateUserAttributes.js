const AWS = require('aws-sdk'); // eslint-disable-line

const awsConfig = require('./aws.config.json');

// update user attributes in Cogntio
module.exports.adminUpdateUserAttributes = async (email, payload) => {
  if (!global.cognito) {
    global.cognito = new AWS.CognitoIdentityServiceProvider(awsConfig.cognito);
  }

  const awsPayload = {
    Username: email,
    UserPoolId: awsConfig.cognito.userPoolId,
    UserAttributes: [],
  };

  if (payload.name) {
    awsPayload.UserAttributes.push({
      Name: 'name',
      Value: payload.name,
    });
  }
  if (payload.phone) {
    awsPayload.UserAttributes.push({
      Name: 'phone_number',
      Value: payload.phone,
    });
    awsPayload.UserAttributes.push({
      Name: 'phone_number_verified',
      Value: 'false',
    });
  }
  if (payload.email && email !== payload.email) {
    awsPayload.UserAttributes.push({
      Name: 'email',
      Value: payload.email,
    });
    awsPayload.UserAttributes.push({
      Name: 'email_verified',
      Value: 'true',
    });
    awsPayload.UserAttributes.push({
      Name: 'custom:email_ver',
      Value: 'false',
    });
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'emailAdditional')) {
    awsPayload.UserAttributes.push({
      Name: 'custom:email_additional',
      Value: payload.emailAdditional,
    });
    awsPayload.UserAttributes.push({
      Name: 'custom:email_additional_ver',
      Value: 'false',
    });
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'emailVerified')) {
    awsPayload.UserAttributes.push({
      Name: 'custom:email_ver',
      Value: JSON.stringify(payload.emailVerified),
    });
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'emailAdditionalVerified')) {
    awsPayload.UserAttributes.push({
      Name: 'custom:email_additional_ver',
      Value: JSON.stringify(payload.emailAdditionalVerified),
    });
  }

  try {
    await new Promise((resolve, reject) => {
      global.cognito.adminUpdateUserAttributes(awsPayload, (errorCallback, response) => {
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
