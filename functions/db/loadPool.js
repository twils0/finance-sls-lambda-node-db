const { getSecret } = require('../aws/getSecret');
const { Pool } = require('pg');

// load a postgresql pool to connect to the database
module.exports.loadPool = async () => {
  // keep as a global variable, to avoid
  // reloading for each call to a lambda instance
  if (!global.pool) {
    try {
      const result = await getSecret('finance-sls-lambda-node-db');

      if (!result || !result.value) {
        return Promise.reject('unexpected error - unable to access db credentials from getSecret');
      }

      global.pool = new Pool({
        ...result.value,
        min: 0,
        max: 1,
        idleTimeoutMillis: 1, // milliseconds
        connectionTimeoutMillis: 1000,
      });

      global.pool.on('error', (error) => {
        console.log('unexpected error - most likely idle client; function will end\n', error);
        process.exit(-1);
      });

      console.log('DB Loaded\n');
    } catch (errorCatch) {
      return Promise.reject(errorCatch);
    }
  }

  return null;
};
