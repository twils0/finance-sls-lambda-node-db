const AWS = require('aws-sdk'); // eslint-disable-line

const awsConfig = require('./aws.config.json');

// get secret from Secrets Manager
module.exports.getSecret = async (key) => {
  if (!global.secretsManager) {
    global.secretsManager = new AWS.SecretsManager(awsConfig.secretsManager);
  }

  let value = null;

  try {
    value = await new Promise((resolve, reject) => {
      global.secretsManager.getSecretValue({ SecretId: key }, (errorCallback, data) => {
        if (errorCallback) {
          reject(errorCallback);
        } else if (data && data.SecretString) {
          resolve(JSON.parse(data.SecretString));
        } else {
          reject('unexpected error - missing secret string');
        }
      });
    });
  } catch (errorCatch) {
    return Promise.reject(errorCatch);
  }

  return { value };
};
