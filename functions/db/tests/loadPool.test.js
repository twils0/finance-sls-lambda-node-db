const { getSecret } = require('../../aws/getSecret');
const { Pool } = require('pg');

const { loadPool } = require('../loadPool');

global.console.log = jest.fn();
global.process.exit = jest.fn();
jest.mock('../../aws/getSecret', () => ({
  getSecret: jest.fn(),
}));
jest.mock('pg', () => ({
  Pool: jest.fn(),
}));
const pool = {
  on: jest.fn(),
};

const getSecretValue = {
  key1: 'value1',
  key2: 'value2',
};
const poolConfig = {
  ...getSecretValue,
  min: 0,
  max: 1,
  idleTimeoutMillis: 1,
  connectionTimeoutMillis: 1000,
};

describe('functions', () => {
  describe('db', () => {
    describe('loadPool', () => {
      afterEach(() => {
        getSecret.mockReset();
        Pool.mockReset();
        pool.on.mockReset();
        global.process.exit.mockReset();
        global.console.log.mockReset();
      });

      it('fails and returns unexpected error, when getSecret throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        getSecret.mockReturnValue(Promise.reject(error));

        try {
          await loadPool();
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
      });

      it('fails and returns unexpected error, when getSecret does not return a value', async () => {
        getSecret.mockReturnValue(Promise.resolve());

        try {
          await loadPool();
        } catch (errorCatch) {
          expect(errorCatch).toMatchSnapshot();
        }
      });

      it('fails and returns unexpected error, when pool throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        getSecret.mockReturnValue(Promise.resolve({ value: getSecretValue }));
        pool.on.mockImplementation((type, callback) => callback(error));
        Pool.mockImplementation((config) => {
          expect(config).toEqual(poolConfig);
          return pool;
        });

        try {
          await loadPool();
        } catch (errorCatch) {
          expect(errorCatch).toMatchSnapshot();
        }

        expect(global.pool.on).toBeCalled();
        expect(global.process.exit).toBeCalledWith(-1);
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly loads db', async () => {
        getSecret.mockReturnValue(Promise.resolve({ value: getSecretValue }));
        Pool.mockImplementation((config) => {
          expect(config).toEqual(poolConfig);
          return pool;
        });

        const result = await loadPool();

        expect(result).toEqual(null);
        expect(global.console.log).toMatchSnapshot();
      });
    });
  });
});
