const { loadPool } = require('../../../../functions/db/loadPool');
const { parseSNS } = require('../../../../functions/aws/sns/parseSNS');
const { addUser } = require('../../../../functions/db/addUser');
const { signUp } = require('../../../../functions/aws/signUp');

const { signUpUser } = require('../handler');

global.console.log = jest.fn();
jest.mock('../../../../functions/db/loadPool', () => ({
  loadPool: jest.fn(),
}));
jest.mock('../../../../functions/aws/sns/parseSNS', () => ({
  parseSNS: jest.fn(),
}));
jest.mock('../../../../functions/db/addUser', () => ({
  addUser: jest.fn(),
}));
jest.mock('../../../../functions/aws/signUp', () => ({
  signUp: jest.fn(),
}));
jest.mock('../../../../functions/errorResponse', () => ({
  errorResponse: jest.fn(error => error),
}));

const email = 'test1@test.com';
const emailAdditional = 'test2@test.com';
const password = 'testPassword1!';
const messageNoPassword = {
  email,
  emailAdditional,
};
const message = {
  ...messageNoPassword,
  password,
};
const event = {
  Records: [
    {
      Sns: {
        Message: JSON.stringify(message),
      },
    },
  ],
};
const userId = 'testUserID';
global.pool = { test: 'testPool' };

const emptyResponse = {
  status: 200,
  body: {
    message: 'success',
  },
};
const response = {
  status: 200,
  body: {
    message: 'success',
  },
};
const callback = jest.fn();

describe('handlers', () => {
  describe('sns', () => {
    describe('signUpUser', () => {
      afterEach(() => {
        loadPool.mockReset();
        parseSNS.mockReset();
        addUser.mockReset();
        signUp.mockReset();
        global.console.log.mockReset();
        callback.mockReset();
      });

      it('fails and returns error, when loadPool throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.reject(error));

        await signUpUser(event, null, callback);

        expect(callback).toBeCalledWith(error, emptyResponse);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when parseSNS throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.resolve());
        parseSNS.mockReturnValue(Promise.reject(error));

        await signUpUser(event, null, callback);

        expect(parseSNS).toBeCalledWith(event);
        expect(callback).toBeCalledWith(error, emptyResponse);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when addUser throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.resolve());
        parseSNS.mockReturnValue(Promise.resolve(message));
        addUser.mockReturnValue(Promise.reject(error));

        await signUpUser(event, null, callback);

        expect(parseSNS).toBeCalledWith(event);
        expect(addUser).toBeCalledWith(messageNoPassword);
        expect(callback).toBeCalledWith(error, emptyResponse);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when signUp throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.resolve());
        parseSNS.mockReturnValue(Promise.resolve(message));
        addUser.mockReturnValue(Promise.resolve({ userId }));
        signUp.mockReturnValue(Promise.reject(error));

        await signUpUser(event, null, callback);

        expect(parseSNS).toBeCalledWith(event);
        expect(addUser).toBeCalledWith(messageNoPassword);
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly signs up user', async () => {
        loadPool.mockReturnValue(Promise.resolve());
        parseSNS.mockReturnValue(Promise.resolve(message));
        addUser.mockReturnValue(Promise.resolve({ userId }));
        signUp.mockReturnValue(Promise.resolve());

        await signUpUser(event, null, callback);

        expect(parseSNS).toBeCalledWith(event);
        expect(addUser).toBeCalledWith(messageNoPassword);
        expect(signUp).toBeCalledWith({ ...message, userId });
        expect(callback).toBeCalledWith(null, response);
        expect(global.console.log).toMatchSnapshot();
      });
    });
  });
});
