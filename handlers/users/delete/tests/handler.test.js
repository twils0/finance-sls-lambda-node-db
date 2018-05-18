const { testAuth } = require('../../../../functions/aws/testAuth');
const { loadPool } = require('../../../../functions/db/loadPool');
const { deleteUser } = require('../../../../functions/db/deleteUser');

const deleteExport = require('../handler');

const deleteModule = deleteExport.delete;

global.console.log = jest.fn();
jest.mock('../../../../functions/aws/testAuth', () => ({
  testAuth: jest.fn(),
}));
jest.mock('../../../../functions/db/loadPool', () => ({
  loadPool: jest.fn(),
}));
jest.mock('../../../../functions/db/deleteUser', () => ({
  deleteUser: jest.fn(),
}));
jest.mock('../../../../functions/errorResponse', () => ({
  errorResponse: jest.fn(error => error),
}));

const event = {
  query: {
    accessToken: 'testAccessToken',
  },
  cognitoPoolClaims: {
    user_id: 'testUserID',
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
    describe('delete', () => {
      afterEach(() => {
        loadPool.mockReset();
        deleteUser.mockReset();
        global.console.log.mockReset();
        callback.mockReset();
      });

      it('fails and returns error, when testAuth throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        testAuth.mockReturnValue(Promise.reject(error));

        await deleteModule(event, null, callback);

        expect(testAuth).toBeCalledWith(event.query.accessToken);
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

        await deleteModule(event, null, callback);

        expect(testAuth).toBeCalledWith(event.query.accessToken);
        expect(loadPool).toBeCalled();
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when deleteUser throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        deleteUser.mockReturnValue(Promise.reject(error));

        await deleteModule(event, null, callback);

        expect(testAuth).toBeCalledWith(event.query.accessToken);
        expect(loadPool).toBeCalled();
        expect(deleteUser).toBeCalledWith(event.cognitoPoolClaims.user_id);
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly deletes user', async () => {
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        deleteUser.mockReturnValue(Promise.resolve());

        await deleteModule(event, null, callback);

        expect(testAuth).toBeCalledWith(event.query.accessToken);
        expect(loadPool).toBeCalled();
        expect(deleteUser).toBeCalledWith(event.cognitoPoolClaims.user_id);
        expect(callback).toBeCalledWith(null, response);
        expect(global.console.log).toMatchSnapshot();
      });
    });
  });
});
