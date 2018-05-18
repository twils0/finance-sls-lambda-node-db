const { testAuth } = require('../../../../functions/aws/testAuth');
const { loadPool } = require('../../../../functions/db/loadPool');
const { getSecurities } = require('../../../../functions/db/getSecurities');

const { get } = require('../handler');

global.console.log = jest.fn();
jest.mock('../../../../functions/aws/testAuth', () => ({
  testAuth: jest.fn(),
}));
jest.mock('../../../../functions/db/loadPool', () => ({
  loadPool: jest.fn(),
}));
jest.mock('../../../../functions/db/getSecurities', () => ({
  getSecurities: jest.fn(),
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
const securities = {
  testId1: {
    id: 'testId1',
    name: 'testName1',
    exchange: 'testExchange1',
    tickerCusip: 'testTicker1',
    category: 'testCategory1',
  },
  testId2: {
    id: 'testId2',
    name: 'testName2',
    exchange: 'testExchange2',
    tickerCusip: 'testTicker2',
    category: 'testCategory2',
  },
};
const response = {
  status: 200,
  body: {
    securities,
  },
};
const emptyResponse = {
  status: 200,
  body: {
    securities: null,
  },
};
const callback = jest.fn();

describe('handlers', () => {
  describe('users', () => {
    describe('get', () => {
      afterEach(() => {
        loadPool.mockReset();
        testAuth.mockReset();
        getSecurities.mockReset();
        global.console.log.mockReset();
        callback.mockReset();
      });

      it('fails and returns error, when testAuth throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        testAuth.mockReturnValue(Promise.reject(error));

        await get(event, null, callback);

        expect(callback).toBeCalledWith(error, emptyResponse);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when loadPool throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.reject(error));

        await get(event, null, callback);

        expect(testAuth).toBeCalledWith(event.query.accessToken);
        expect(loadPool).toBeCalled();
        expect(callback).toBeCalledWith(error, emptyResponse);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when getSecurities returns an error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        getSecurities.mockReturnValue(Promise.reject(error));

        await get(event, null, callback);

        expect(testAuth).toBeCalledWith(event.query.accessToken);
        expect(loadPool).toBeCalled();
        expect(getSecurities).toBeCalledWith(event.cognitoPoolClaims.user_id);
        expect(callback).toBeCalledWith(error, emptyResponse);
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly responds with subscription securities', async () => {
        testAuth.mockReturnValue(Promise.resolve());
        loadPool.mockReturnValue(Promise.resolve());
        getSecurities.mockReturnValue(Promise.resolve({ securities }));

        await get(event, null, callback);

        expect(getSecurities).toBeCalledWith(event.cognitoPoolClaims.user_id);
        expect(loadPool).toBeCalled();
        expect(testAuth).toBeCalledWith(event.query.accessToken);
        expect(callback).toBeCalledWith(null, response);
        expect(global.console.log).toMatchSnapshot();
      });
    });
  });
});
