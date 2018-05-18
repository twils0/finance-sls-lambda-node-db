const { testAuth } = require('../../../../functions/aws/testAuth');
const { loadPool } = require('../../../../functions/db/loadPool');
const { searchSecurities } = require('../../../../functions/db/searchSecurities');
const { errorResponse } = require('../../../../functions/errorResponse');

// search for a security in the database, using full text search
module.exports.get = async (event, context, callback) => {
  let error = null;
  const { accessToken } = event.query;

  try {
    console.log('testAuth\n');

    await testAuth(accessToken);
  } catch (errorCatch) {
    error = errorCatch;
  }

  if (!error) {
    try {
      console.log('loadPool\n');

      await loadPool();
    } catch (errorCatch) {
      error = errorCatch;
    }
  }

  const { query } = event;

  if (!error && !Object.prototype.hasOwnProperty.call(query, 'search')) {
    error = {
      code: 'invalid_query',
      message: "Please provide a 'search' key as a query string",
    };
  }

  let securities = null;

  if (!error) {
    try {
      console.log('searchSecurities\n', query, '\n');

      ({ securities } = await searchSecurities(query));

      console.log('searchSecurities - success\n', securities, '\n');
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
      securities,
    },
  };

  callback(errorRes, response);
};
