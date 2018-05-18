const { loadPool } = require('../../../../functions/db/loadPool');
const { updateUser } = require('../../../../functions/db/updateUser');
const {
  adminUpdateUserAttributes,
} = require('../../../../functions/aws/adminUpdateUserAttributes');

const { put } = require('../handler');

global.console.log = jest.fn();
jest.mock('../../../../functions/db/loadPool', () => ({
  loadPool: jest.fn(),
}));
jest.mock('../../../../functions/db/updateUser', () => ({
  updateUser: jest.fn(),
}));
jest.mock('../../../../functions/aws/adminUpdateUserAttributes', () => ({
  adminUpdateUserAttributes: jest.fn(),
}));
jest.mock('../../../../functions/errorResponse', () => ({
  errorResponse: jest.fn(error => error),
}));

const username = 'test1@test.com';
const verificationId = '43663f5d-a27c-4e1f-8d22-0b0f42b1b27a';
const emailVerificationId = '7cfcfcc9-0e50-4a0b-90a7-d340a2e51960';
const emailAdditionalVerificationId = 'a14dfb83-c3c5-4854-8e53-b6dd0e36205f';
const event = {
  body: {
    verificationId,
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
    describe('put', () => {
      afterEach(() => {
        loadPool.mockReset();
        updateUser.mockReset();
        adminUpdateUserAttributes.mockReset();
        global.console.log.mockReset();
        callback.mockReset();
      });

      it('fails and returns error, when loadPool throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.reject(error));

        await put(event, null, callback);

        expect(loadPool).toBeCalled();
        expect(updateUser).not.toBeCalled();
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when updateUser throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValue(Promise.reject(error));

        await put(event, null, callback);

        expect(updateUser).toBeCalledWith(null, {
          verificationId,
        });
        expect(adminUpdateUserAttributes).not.toBeCalled();
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when adminUpdateUserAttributes throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValue(
          Promise.resolve({
            username,
            emailVerificationId: null,
            emailAdditionalVerificationId,
          })
        );
        adminUpdateUserAttributes.mockReturnValue(Promise.reject(error));

        await put(event, null, callback);

        expect(updateUser).toBeCalledWith(null, {
          verificationId,
        });
        expect(adminUpdateUserAttributes).toBeCalledWith(username, { emailVerified: true });
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly sendsTemplated email or emails, with email verified', async () => {
        loadPool.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValue(
          Promise.resolve({
            username,
            emailVerificationId: null,
            emailAdditionalVerificationId,
          })
        );

        await put(event, null, callback);

        expect(updateUser).toBeCalledWith(null, {
          verificationId,
        });
        expect(adminUpdateUserAttributes).toBeCalledWith(username, { emailVerified: true });
        expect(callback).toBeCalledWith(null, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly sendsTemplated email or emails, with email additional verified', async () => {
        loadPool.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValue(
          Promise.resolve({
            username,
            emailVerificationId,
            emailAdditionalVerificationId: null,
          })
        );

        await put(event, null, callback);

        expect(updateUser).toBeCalledWith(null, {
          verificationId,
        });
        expect(adminUpdateUserAttributes).toBeCalledWith(username, {
          emailAdditionalVerified: true,
        });
        expect(callback).toBeCalledWith(null, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly sendsTemplated email or emails, with email and email additional verified', async () => {
        loadPool.mockReturnValue(Promise.resolve());
        updateUser.mockReturnValue(
          Promise.resolve({
            username,
            emailVerificationId: null,
            emailAdditionalVerificationId: null,
          })
        );

        await put(event, null, callback);

        expect(updateUser).toBeCalledWith(null, {
          verificationId,
        });
        expect(adminUpdateUserAttributes).toBeCalledWith(username, {
          emailVerified: true,
          emailAdditionalVerified: true,
        });
        expect(callback).toBeCalledWith(null, response);
        expect(global.console.log).toMatchSnapshot();
      });
    });
  });
});
