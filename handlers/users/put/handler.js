const { loadPool } = require('../../../functions/db/loadPool');
const { testAuth } = require('../../../functions/aws/testAuth');
const { testUser } = require('../../../functions/aws/testUser');
const { updateUser } = require('../../../functions/db/updateUser');
const { getUser } = require('../../../functions/db/getUser');
const { adminUpdateUserAttributes } = require('../../../functions/aws/adminUpdateUserAttributes');
const { updateSecurities } = require('../../../functions/db/updateSecurities');
const { sendTemplatedEmail } = require('../../../functions/aws/ses/sendTemplatedEmail');
const { errorResponse } = require('../../../functions/errorResponse');

// update the user's current (last viewed) securityId, the list of
// securityIds to which the user is subscribed, the user's email
// and/or the user's emailAdditional; send a verification email
// if the user's email or emailAdditional has been updated, to
// verify any new email addresses
module.exports.put = async (event, context, callback) => {
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

  const { body } = event;

  if (
    Object.prototype.hasOwnProperty.call(body, 'current') ||
    Object.prototype.hasOwnProperty.call(body, 'list')
  ) {
    if (!error && !Object.prototype.hasOwnProperty.call(body, 'current')) {
      error = {
        code: 'invalid_body',
        message: "Please provide a 'current' key in the body of your request.",
      };
    }
    if (!error && !Object.prototype.hasOwnProperty.call(body, 'list')) {
      error = {
        code: 'invalid_body',
        message: "Please provide a 'list' key in the body of your request.",
      };
    }
  }

  const template = 'verificationEmailTemplate';
  let emailVerificationId = null;
  let emailAdditionalVerificationId = null;
  const userId = event.cognitoPoolClaims.user_id;
  let username = null;

  if (!error && body.email) {
    try {
      console.log('testUser\n', body.email, '\n');

      await testUser(body.email, userId);
    } catch (errorCatch) {
      error = errorCatch;
    }
  }

  if (!error) {
    try {
      if (body.email || Object.prototype.hasOwnProperty.call(body, 'emailAdditional')) {
        console.log('updateUser\n', body, '\n');

        ({ username } = await updateUser(userId, body));

        console.log('updateUser - success\n', username, '\n');
      } else if (body.name || body.phone) {
        console.log('getUser\n');

        ({ username } = await getUser(userId));

        console.log('getUser - success\n', username, '\n');
      }
    } catch (errorCatch) {
      error = errorCatch;
    }
  }

  if (
    !error &&
    (body.name ||
      body.phone ||
      body.email ||
      Object.prototype.hasOwnProperty.call(body, 'emailAdditional'))
  ) {
    try {
      console.log('adminUpdateUserAttributes\n', username, '\n', body, '\n');

      await adminUpdateUserAttributes(username, body);
    } catch (errorCatch) {
      error = errorCatch;
    }
  }

  if (
    !error &&
    ((body.current && body.list) || (!body.current && body.list && body.list.length === 0))
  ) {
    try {
      console.log('updateSecurities\n', body, '\n');

      await updateSecurities(userId, body);
    } catch (errorCatch) {
      error = errorCatch;
    }
  }

  if (!error && (body.email || body.emailAdditional)) {
    const verifyAttributes = {};

    if (body.email) {
      verifyAttributes.emailVerified = 'false';
    }
    if (body.emailAdditional) {
      verifyAttributes.emailAdditionalVerified = 'false';
    }

    try {
      console.log('updateUser\n', verifyAttributes, '\n');

      ({ emailVerificationId, emailAdditionalVerificationId } = await updateUser(
        userId,
        verifyAttributes,
      ));

      console.log(
        'updateUser - success\n',
        emailVerificationId,
        '\n',
        emailAdditionalVerificationId,
        '\n',
      );
    } catch (errorCatch) {
      error = errorCatch;
    }
  }

  if (!error) {
    try {
      if (emailVerificationId && emailAdditionalVerificationId) {
        console.log(
          'sendTemplatedEmail\n',
          template,
          '\n',
          { verificationId: emailVerificationId },
          '\n',
          [body.email],
          '\n',
        );
        console.log(
          'sendTemplatedEmail\n',
          template,
          '\n',
          { verificationId: emailAdditionalVerificationId },
          '\n',
          [body.emailAdditional],
          '\n',
        );

        await Promise.all([
          await sendTemplatedEmail(template, { verificationId: emailVerificationId }, [body.email]),
          await sendTemplatedEmail(template, { verificationId: emailAdditionalVerificationId }, [
            body.emailAdditional,
          ]),
        ]);
      } else if (emailVerificationId || emailAdditionalVerificationId) {
        let data = null;
        const emailAddresses = [];

        if (emailVerificationId) {
          data = { verificationId: emailVerificationId };
          emailAddresses.push(body.email);
        } else {
          data = { verificationId: emailAdditionalVerificationId };
          emailAddresses.push(body.emailAdditional);
        }
        console.log('sendTemplatedEmail\n', template, '\n', data, '\n', emailAddresses, '\n');

        await sendTemplatedEmail(template, data, emailAddresses);
      }
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
