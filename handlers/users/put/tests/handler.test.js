const { testAuth } = require('../../../../functions/aws/testAuth');
const { loadPool } = require('../../../../functions/db/loadPool');
const { testUser } = require('../../../../functions/aws/testUser');
const { updateUser } = require('../../../../functions/db/updateUser');
const {
  adminUpdateUserAttributes,
} = require('../../../../functions/aws/adminUpdateUserAttributes');
const { sendTemplatedEmail } = require('../../../../functions/aws/ses/sendTemplatedEmail');
const { updateSecurities } = require('../../../../functions/db/updateSecurities');

const { put } = require('../handler');

global.console.log = jest.fn();
jest.mock('../../../../functions/aws/testAuth', () => ({
  testAuth: jest.fn(),
}));
jest.mock('../../../../functions/db/loadPool', () => ({
  loadPool: jest.fn(),
}));
jest.mock('../../../../functions/aws/testUser', () => ({
  testUser: jest.fn(),
}));
jest.mock('../../../../functions/db/updateUser', () => ({
  updateUser: jest.fn(),
}));
jest.mock('../../../../functions/aws/adminUpdateUserAttributes', () => ({
  adminUpdateUserAttributes: jest.fn(),
}));
jest.mock('../../../../functions/aws/ses/sendTemplatedEmail', () => ({
  sendTemplatedEmail: jest.fn(),
}));
jest.mock('../../../../functions/db/updateSecurities', () => ({
  updateSecurities: jest.fn(),
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
const event = {
  query: {
    accessToken,
  },
  cognitoPoolClaims: {
    email,
    user_id: userId,
  },
  body: {
    current: 'testId1',
    list: ['testId1', 'testId2'],
  },
};
const emailEvent = {
  query: {
    accessToken,
  },
  cognitoPoolClaims: {
    user_id: userId,
  },
  body: {
    email,
    current: 'testId1',
    list: ['testId1', 'testId2'],
  },
};
const emailAdditionalEvent = {
  query: {
    accessToken,
  },
  cognitoPoolClaims: {
    user_id: userId,
  },
  body: {
    emailAdditional,
  },
};
const emailEmailAdditionalEvent = {
  query: {
    accessToken,
  },
  cognitoPoolClaims: {
    user_id: userId,
  },
  body: {
    email,
    emailAdditional,
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
  describe('users', () => {
    describe('put', () => {
      afterEach(() => {
        loadPool.mockReset();
        testAuth.mockReset();
        testUser.mockReset();
        updateUser.mockReset();
        adminUpdateUserAttributes.mockReset();
        updateSecurities.mockReset();
        sendTemplatedEmail.mockReset();
        global.console.log.mockReset();
        callback.mockReset();
      });

      it('fails and returns error, when testAuth throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        testAuth.mockReturnValue(Promise.reject(error));

        await put(event, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when loadPool throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.reject(error));

        await put(event, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(loadPool).toBeCalled();
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it("fails and returns error, when missing 'current' key in event body", async () => {
        const wrongEvent = {
          query: {
            accessToken,
          },
          cognitoPoolClaims: {
            user_id: userId,
          },
          body: {
            list: ['testId1', 'testId2'],
          },
        };

        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        callback.mockImplementation((error, resp) => {
          expect(error).toMatchSnapshot();
          expect(resp).toEqual(response);
        });

        await put(wrongEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(loadPool).toBeCalled();
        expect(callback).toBeCalled();
        expect(global.console.log).toMatchSnapshot();
      });

      it("fails and returns error, when missing 'list' key in event body", async () => {
        const wrongEvent = {
          query: {
            accessToken,
          },
          cognitoPoolClaims: {
            user_id: userId,
          },
          body: {
            current: 'testId1',
          },
        };

        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        callback.mockImplementation((error, resp) => {
          expect(error).toMatchSnapshot();
          expect(resp).toEqual(response);
        });

        await put(wrongEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(loadPool).toBeCalled();
        expect(callback).toBeCalled();
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when testUser throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        testUser.mockReturnValue(Promise.reject(error));

        await put(emailEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(loadPool).toBeCalled();
        expect(testUser).toBeCalledWith(emailEvent.body.email, userId);
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when the first updateUser throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        testUser.mockReturnValue(Promise.reject());
        updateUser.mockReturnValue(Promise.reject(error));

        await put(emailEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(loadPool).toBeCalled();
        expect(testUser).toBeCalledWith(emailEvent.body.email, userId);
        expect(updateUser).toBeCalledWith(userId, emailEvent.body);
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when adminUpdateUserAttributes throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValueOnce(Promise.resolve({ username: email }));
        adminUpdateUserAttributes.mockReturnValue(Promise.reject(error));

        await put(emailAdditionalEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(loadPool).toBeCalled();
        expect(testUser).not.toBeCalled();
        expect(updateUser).toBeCalledWith(userId, emailAdditionalEvent.body);
        expect(adminUpdateUserAttributes).toBeCalledWith(email, emailAdditionalEvent.body);
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when updateSecurities returns an error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        updateSecurities.mockReturnValue(Promise.reject(error));

        await put(event, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(loadPool).toBeCalled();
        expect(testUser).not.toBeCalled();
        expect(updateUser).not.toBeCalled();
        expect(adminUpdateUserAttributes).not.toBeCalled();
        expect(updateSecurities).toBeCalledWith(userId, event.body);
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when the second updateUser throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        testUser.mockReturnValueOnce(Promise.resolve());
        updateUser.mockReturnValueOnce(Promise.resolve({ username: email }));
        adminUpdateUserAttributes.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValue(Promise.reject(error));

        await put(emailEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(loadPool).toBeCalled();
        expect(testUser).toBeCalledWith(emailEvent.body.email, userId);
        expect(updateUser).toBeCalledWith(userId, emailEvent.body);
        expect(adminUpdateUserAttributes).toBeCalledWith(email, emailEvent.body);
        expect(updateUser).toBeCalledWith(userId, { emailVerified: 'false' });
        expect(updateUser).toHaveBeenCalledTimes(2);
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when sendTemplatedEmail throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        testUser.mockReturnValueOnce(Promise.resolve());
        updateUser.mockReturnValueOnce(Promise.resolve({ username: email }));
        adminUpdateUserAttributes.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValue(Promise.resolve({ emailVerificationId }));
        sendTemplatedEmail.mockReturnValue(Promise.reject(error));

        await put(emailEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(loadPool).toBeCalled();
        expect(testUser).toBeCalledWith(emailEvent.body.email, userId);
        expect(updateUser).toBeCalledWith(userId, emailEvent.body);
        expect(adminUpdateUserAttributes).toBeCalledWith(email, emailEvent.body);
        expect(updateUser).toBeCalledWith(userId, { emailVerified: 'false' });
        expect(updateUser).toHaveBeenCalledTimes(2);
        expect(sendTemplatedEmail).toBeCalledWith(
          template,
          { verificationId: emailVerificationId },
          [emailEvent.body.email],
        );
        expect(sendTemplatedEmail).toHaveBeenCalledTimes(1);
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly updates subscription securities, without email or emailAdditional in body', async () => {
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        updateSecurities.mockReturnValue(Promise.resolve());

        await put(event, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(loadPool).toBeCalled();
        expect(testUser).not.toBeCalled();
        expect(updateUser).not.toBeCalled();
        expect(adminUpdateUserAttributes).not.toBeCalled();
        expect(updateSecurities).toBeCalledWith(userId, event.body);
        expect(callback).toBeCalledWith(null, response);
        expect(sendTemplatedEmail).not.toBeCalled();
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly updates subscription securities, with emailAdditional in body', async () => {
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValueOnce(Promise.resolve({ username: email }));
        adminUpdateUserAttributes.mockReturnValue(Promise.resolve());
        updateSecurities.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValue(Promise.resolve({ emailAdditionalVerificationId }));

        await put(emailAdditionalEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(loadPool).toBeCalled();
        expect(testUser).not.toBeCalled();
        expect(updateUser).toBeCalledWith(userId, emailAdditionalEvent.body);
        expect(adminUpdateUserAttributes).toBeCalledWith(email, emailAdditionalEvent.body);
        expect(updateSecurities).not.toBeCalled();
        expect(updateUser).toBeCalledWith(userId, {
          emailAdditionalVerified: 'false',
        });
        expect(updateUser).toHaveBeenCalledTimes(2);
        expect(sendTemplatedEmail).toBeCalledWith(
          template,
          { verificationId: emailAdditionalVerificationId },
          [emailAdditionalEvent.body.emailAdditional],
        );
        expect(sendTemplatedEmail).toHaveBeenCalledTimes(1);
        expect(callback).toBeCalledWith(null, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly updates subscription securities, with email in body', async () => {
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        testUser.mockReturnValueOnce(Promise.resolve());
        updateUser.mockReturnValueOnce(Promise.resolve({ username: email }));
        adminUpdateUserAttributes.mockReturnValue(Promise.resolve());
        updateSecurities.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValue(Promise.resolve({ emailVerificationId }));

        await put(emailEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(loadPool).toBeCalled();
        expect(testUser).toBeCalledWith(emailEvent.body.email, userId);
        expect(updateUser).toBeCalledWith(userId, emailEvent.body);
        expect(adminUpdateUserAttributes).toBeCalledWith(email, emailEvent.body);
        expect(updateSecurities).toBeCalledWith(userId, emailEvent.body);
        expect(updateUser).toBeCalledWith(userId, {
          emailVerified: 'false',
        });
        expect(updateUser).toHaveBeenCalledTimes(2);
        expect(sendTemplatedEmail).toBeCalledWith(
          template,
          { verificationId: emailVerificationId },
          [emailEvent.body.email],
        );
        expect(sendTemplatedEmail).toHaveBeenCalledTimes(1);
        expect(callback).toBeCalledWith(null, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly updates subscription securities, with email and emailAdditional in body', async () => {
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        testUser.mockReturnValueOnce(Promise.resolve());
        updateUser.mockReturnValueOnce(Promise.resolve({ username: email }));
        adminUpdateUserAttributes.mockReturnValue(Promise.resolve());
        updateSecurities.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValue(Promise.resolve({
          emailVerificationId,
          emailAdditionalVerificationId,
        }));

        await put(emailEmailAdditionalEvent, null, callback);

        expect(testAuth).toBeCalledWith(accessToken);
        expect(loadPool).toBeCalled();
        expect(testUser).toBeCalledWith(emailEmailAdditionalEvent.body.email, userId);
        expect(updateUser).toBeCalledWith(userId, emailEmailAdditionalEvent.body);
        expect(adminUpdateUserAttributes).toBeCalledWith(email, emailEmailAdditionalEvent.body);
        expect(updateSecurities).not.toBeCalled();
        expect(updateUser).toBeCalledWith(userId, {
          emailVerified: 'false',
          emailAdditionalVerified: 'false',
        });
        expect(updateUser).toHaveBeenCalledTimes(2);
        expect(sendTemplatedEmail).toBeCalledWith(
          template,
          { verificationId: emailVerificationId },
          [emailEmailAdditionalEvent.body.email],
        );
        expect(sendTemplatedEmail).toBeCalledWith(
          template,
          { verificationId: emailAdditionalVerificationId },
          [emailEmailAdditionalEvent.body.emailAdditional],
        );
        expect(sendTemplatedEmail).toHaveBeenCalledTimes(2);
        expect(callback).toBeCalledWith(null, response);
        expect(global.console.log).toMatchSnapshot();
      });
    });
  });
});
