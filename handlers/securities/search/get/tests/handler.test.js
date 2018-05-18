const { loadPool } = require('../../../../../functions/db/loadPool');
const { searchSecurities } = require('../../../../../functions/db/searchSecurities');

const { get } = require('../handler');

global.console.log = jest.fn();
jest.mock('../../../../../functions/db/loadPool', () => ({
  loadPool: jest.fn(),
}));
jest.mock('../../../../../functions/db/searchSecurities', () => ({
  searchSecurities: jest.fn(),
}));
jest.mock('../../../../../functions/errorResponse', () => ({
  errorResponse: jest.fn(error => error),
}));

const event = {
  query: {
    search: 'testSearch',
  },
};
global.pool = { test: 'testPool' };
const securities = [{ test1: 'testSecurity1' }, { test2: 'testSecurity2' }];
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
  describe('securities', () => {
    describe('get', () => {
      afterEach(() => {
        loadPool.mockReset();
        searchSecurities.mockReset();
        global.console.log.mockReset();
        callback.mockReset();
      });

      it('fails and returns error, when loadPool throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.reject(error));

        await get(event, null, callback);

        expect(loadPool).toBeCalled();
        expect(callback).toBeCalledWith(error, emptyResponse);
        expect(global.console.log).toMatchSnapshot();
      });

      it("fails and returns error, when missing 'search' in query", async () => {
        const wrongEvent = {
          query: {},
        };
        loadPool.mockReturnValue(Promise.resolve());
        callback.mockImplementation((error, resp) => {
          expect(error).toMatchSnapshot();
          expect(resp).toEqual(emptyResponse);
        });

        await get(wrongEvent, null, callback);

        expect(loadPool).toBeCalled();
        expect(callback).toBeCalled();
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when searchSecurities returns an error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.resolve());
        searchSecurities.mockReturnValue(Promise.reject(error));

        await get(event, null, callback);

        expect(loadPool).toBeCalled();
        expect(searchSecurities).toBeCalledWith(event.query);
        expect(callback).toBeCalledWith(error, emptyResponse);
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly responds with a security', async () => {
        loadPool.mockReturnValue(Promise.resolve());
        searchSecurities.mockReturnValue(Promise.resolve({ securities }));

        await get(event, null, callback);

        expect(loadPool).toBeCalled();
        expect(searchSecurities).toBeCalledWith(event.query);
        expect(callback).toBeCalledWith(null, response);
        expect(global.console.log).toMatchSnapshot();
      });
    });
  });
});
