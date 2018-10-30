const { testAuth } = require('../../../functions/aws/testAuth');
const { loadPool } = require('../../../functions/db/loadPool');
const { getSecurities } = require('../../../functions/db/getSecurities');
const { errorResponse } = require('../../../functions/errorResponse');

// get the user's current (last viewed) securityId, a list of the user's
// subscribed securityIds, and objects for each security, with basic
// information (ticker, name, sector/category, exchange, etc.) related to
// that security
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

  const userId = event.cognitoPoolClaims.user_id;
  let securities = null;

  if (!error) {
    try {
      console.log('getSecurities\n', userId, '\n');

      ({ securities } = await getSecurities(userId));

      console.log('getSecurities - success\n', securities, '\n');
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
