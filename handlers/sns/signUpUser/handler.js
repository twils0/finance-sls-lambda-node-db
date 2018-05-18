const { loadPool } = require('../../../functions/db/loadPool');
const { parseSNS } = require('../../../functions/aws/sns/parseSNS');
const { addUser } = require('../../../functions/db/addUser');
const { signUp } = require('../../../functions/aws/signUp');
const { errorResponse } = require('../../../functions/errorResponse');

// receive an SNS message, after Stipe has verified that a new user's
// username (email) does not already exist in Cognito and after the
// user has been added as a customer to Stripe; add the new user
// to Cogntio and to the database
module.exports.signUpUser = async (event, context, callback) => {
  let error = null;

  try {
    console.log('loadPool\n');

    await loadPool();
  } catch (errorCatch) {
    error = errorCatch;
  }

  let payload = null;
  let userId = null;

  if (!error) {
    try {
      console.log('parseSNS\n');

      payload = await parseSNS(event);
    } catch (errorCatch) {
      error = errorCatch;
    }
  }

  if (!error) {
    const payloadNoPassword = { ...payload };
    delete payloadNoPassword.password;

    if (!error) {
      try {
        console.log('addUser\n', payloadNoPassword, '\n');

        ({ userId } = await addUser(payloadNoPassword));

        console.log('addUser - success\n');
      } catch (errorCatch) {
        error = errorCatch;
      }
    }

    if (!error) {
      payload = { ...payload, userId };

      try {
        console.log('signUp\n', payloadNoPassword, '\n');

        await signUp(payload);
      } catch (errorCatch) {
        error = errorCatch;
      }
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
