const { testAuth } = require('../../../functions/aws/testAuth');
const { loadPool } = require('../../../functions/db/loadPool');
const { deleteUser } = require('../../../functions/db/deleteUser');
const { errorResponse } = require('../../../functions/errorResponse');

// delete a user from Cognito and from the database
module.exports.delete = async (event, context, callback) => {
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

  if (!error) {
    try {
      console.log('deleteUser\n', userId, '\n');

      await deleteUser(userId);
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
      message: 'success',
    },
  };

  callback(errorRes, response);
};
