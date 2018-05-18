const { loadPool } = require('../../../../functions/db/loadPool');
const { testAuth } = require('../../../../functions/aws/testAuth');
const { updateUser } = require('../../../../functions/db/updateUser');
const { sendTemplatedEmail } = require('../../../../functions/aws/ses/sendTemplatedEmail');

const { post } = require('../handler');

global.console.log = jest.fn();
jest.mock('../../../../functions/db/loadPool', () => ({
  loadPool: jest.fn(),
}));
jest.mock('../../../../functions/aws/testAuth', () => ({
  testAuth: jest.fn(),
}));
jest.mock('../../../../functions/db/updateUser', () => ({
  updateUser: jest.fn(),
}));
jest.mock('../../../../functions/aws/ses/sendTemplatedEmail', () => ({
  sendTemplatedEmail: jest.fn(),
}));
jest.mock('../../../../functions/errorResponse', () => ({
  errorResponse: jest.fn(error => error),
}));

const accessToken = { test: 'testAccessToken' };
const userId = 'testUserID';
const template = 'verificationEmailTemplate';
const email = 'test1@test.com';
const emailAdditional = 'test2@test.com';
const emailVerificationId = '43663f5d-a27c-4e1f-8d22-0b0f42b1b27a';
const emailAdditionalVerificationId = '7cfcfcc9-0e50-4a0b-90a7-d340a2e51960';
const emailNeededEvent = {
  query: {
    accessToken,
  },
  cognitoPoolClaims: {
    user_id: userId,
    email,
    email_ver: 'false',
    email_additional: null,
    email_additional_ver: 'true',
  },
};
const emailAdditionalNeededEvent = {
  query: {
    accessToken,
  },
  cognitoPoolClaims: {
    user_id: userId,
    email,
    email_ver: 'true',
    email_additional: emailAdditional,
    email_additional_ver: 'false',
  },
};
const emailEmailAdditionalNeededEvent = {
  query: {
    accessToken,
  },
  cognitoPoolClaims: {
    user_id: userId,
    email,
    email_ver: 'false',
    email_additional: emailAdditional,
    email_additional_ver: 'false',
  },
};

global.pool = { test: 'testPool' };
const response = {
  status: 200,
  body: {
    message: 'success',
  },
};

const callback = jest.fn();

describe('handlers', () => {
  describe('emails', () => {
    describe('post', () => {
      afterEach(() => {
        loadPool.mockReset();
        testAuth.mockReset();
        updateUser.mockReset();
        sendTemplatedEmail.mockReset();
        global.console.log.mockReset();
        callback.mockReset();
      });

      it('fails and returns error, when loadPool throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.reject(error));

        await post(emailNeededEvent, null, callback);

        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when testAuth throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.resolve());
        testAuth.mockReturnValue(Promise.reject(error));

        await post(emailNeededEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when updateUser throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.resolve());
        testAuth.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValue(Promise.reject(error));

        await post(emailNeededEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(updateUser).toBeCalledWith(userId, {
          emailVerified: 'false',
        });
        expect(sendTemplatedEmail).not.toBeCalled();
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when sendTemplatedEmail throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.resolve());
        testAuth.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValue(Promise.resolve({ emailVerificationId }));
        sendTemplatedEmail.mockReturnValue(Promise.reject(error));

        await post(emailNeededEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(updateUser).toBeCalledWith(userId, {
          emailVerified: 'false',
        });
        expect(sendTemplatedEmail).toBeCalledWith(
          template,
          { verificationId: emailVerificationId },
          [email],
        );
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly sends templated email or emails, with email needed', async () => {
        loadPool.mockReturnValue(Promise.resolve());
        testAuth.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValue(Promise.resolve({ emailVerificationId }));

        await post(emailNeededEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(updateUser).toBeCalledWith(userId, {
          emailVerified: 'false',
        });
        expect(sendTemplatedEmail).toBeCalledWith(
          template,
          { verificationId: emailVerificationId },
          [email],
        );
        expect(callback).toBeCalledWith(null, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly sends templated email or emails, with email additional needed', async () => {
        loadPool.mockReturnValue(Promise.resolve());
        testAuth.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValue(Promise.resolve({ emailAdditionalVerificationId }));

        await post(emailAdditionalNeededEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(updateUser).toBeCalledWith(userId, {
          emailVerified: 'true',
          emailAdditionalVerified: 'false',
        });
        expect(sendTemplatedEmail).toBeCalledWith(
          template,
          { verificationId: emailAdditionalVerificationId },
          [emailAdditional],
        );
        expect(callback).toBeCalledWith(null, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly sends templated email or emails, with email and email additional needed', async () => {
        loadPool.mockReturnValue(Promise.resolve());
        testAuth.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValue(Promise.resolve({
          emailVerificationId,
          emailAdditionalVerificationId,
        }));

        await post(emailEmailAdditionalNeededEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(updateUser).toBeCalledWith(userId, {
          emailVerified: 'false',
          emailAdditionalVerified: 'false',
        });
        expect(sendTemplatedEmail).toBeCalledWith(
          template,
          { verificationId: emailAdditionalVerificationId },
          [emailAdditional],
        );
        expect(sendTemplatedEmail).toBeCalledWith(
          template,
          { verificationId: emailVerificationId },
          [email],
        );
        expect(callback).toBeCalledWith(null, response);
        expect(global.console.log).toMatchSnapshot();
      });
    });
  });
});
