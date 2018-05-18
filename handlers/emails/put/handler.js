const { loadPool } = require('../../../functions/db/loadPool');
const { updateUser } = require('../../../functions/db/updateUser');
const { adminUpdateUserAttributes } = require('../../../functions/aws/adminUpdateUserAttributes');
const { errorResponse } = require('../../../functions/errorResponse');

// verify an email address for email or emailAdditional;
// take the uuid provided and search the database;
// if found, delete the uuid from the database, and
// the email address has been verified; if not found,
// do nothing; this API call requires no authentication
// to allow verification, even if the user isn't signed in
module.exports.put = async (event, context, callback) => {
  let error = null;

  try {
    console.log('loadPool\n');

    await loadPool();
  } catch (errorCatch) {
    error = errorCatch;
  }

  const { verificationId } = event.body;
  let username = null;
  let emailVerified = false;
  let emailAdditionalVerified = false;

  if (!error) {
    try {
      let emailVerificationId = null;
      let emailAdditionalVerificationId = null;

      console.log('updateUser\n', verificationId, '\n');

      ({ username, emailVerificationId, emailAdditionalVerificationId } = await updateUser(null, {
        verificationId,
      }));

      console.log(
        'updateUser - success\n',
        username,
        '\n',
        emailVerificationId,
        '\n',
        emailAdditionalVerificationId,
        '\n',
      );

      if (!emailVerificationId) {
        emailVerified = true;
      }
      if (!emailAdditionalVerificationId) {
        emailAdditionalVerified = true;
      }
    } catch (errorCatch) {
      error = errorCatch;
    }
  }

  if (!error && username && (emailVerified || emailAdditionalVerified)) {
    try {
      const verifyAttributes = {};

      if (emailVerified) {
        verifyAttributes.emailVerified = emailVerified;
      }
      if (emailAdditionalVerified) {
        verifyAttributes.emailAdditionalVerified = emailAdditionalVerified;
      }

      console.log('adminUpdateUserAttributes\n', username, '\n', verifyAttributes, '\n');

      await adminUpdateUserAttributes(username, verifyAttributes);
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
