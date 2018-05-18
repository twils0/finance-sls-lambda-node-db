const { testAuth } = require('../../../functions/aws/testAuth');
const { loadPool } = require('../../../functions/db/loadPool');
const { updateUser } = require('../../../functions/db/updateUser');
const { sendTemplatedEmail } = require('../../../functions/aws/ses/sendTemplatedEmail');
const { errorResponse } = require('../../../functions/errorResponse');

// set a uuid in the database for email and/or emailAdditional;
// send a template email, with a link, to any email addresses that
// need to be verified; the uuid from the database will be included
// as part of the link's uuid (to later identify and verify the
// email address)
module.exports.post = async (event, context, callback) => {
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

  const template = 'verificationEmailTemplate';
  let emailVerificationId = null;
  let emailAdditionalVerificationId = null;

  const userId = event.cognitoPoolClaims.user_id;
  const { email } = event.cognitoPoolClaims;
  const emailVerified = event.cognitoPoolClaims.email_ver;
  const emailAdditional = event.cognitoPoolClaims.email_additional;
  const emailAdditionalVerified = event.cognitoPoolClaims.email_additional_ver;

  if (!error) {
    const verifyAttributes = {};

    if (email) {
      verifyAttributes.emailVerified = emailVerified;
    }
    if (emailAdditional) {
      verifyAttributes.emailAdditionalVerified = emailAdditionalVerified;
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
          [email],
          '\n',
        );
        console.log(
          'sendTemplatedEmail\n',
          template,
          '\n',
          { verificationId: emailAdditionalVerificationId },
          '\n',
          [emailAdditional],
          '\n',
        );

        await Promise.all([
          await sendTemplatedEmail(template, { verificationId: emailVerificationId }, [email]),
          await sendTemplatedEmail(template, { verificationId: emailAdditionalVerificationId }, [
            emailAdditional,
          ]),
        ]);
      } else if (emailVerificationId || emailAdditionalVerificationId) {
        let data = null;
        const emailAddresses = [];

        if (emailVerificationId) {
          data = { verificationId: emailVerificationId };
          emailAddresses.push(email);
        } else {
          data = { verificationId: emailAdditionalVerificationId };
          emailAddresses.push(emailAdditional);
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
