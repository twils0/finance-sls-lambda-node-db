const { getSecurities } = require('../getSecurities');

global.pool = {
  query: jest.fn(),
};

const userId = 'testUserID';
const securityId1 = 'testSecurityID1';
const securityId2 = 'testSecurityID2';
const securityId3 = 'testSecurityID3';
const security1 = {
  id: securityId1,
  name: 'testName1',
  exchange: 'testExchange1',
  tickerCusip: 'testTickerCusip1',
  category: 'testCategory1',
};
const security2 = {
  id: securityId2,
  name: 'testName2',
  exchange: 'testExchange2',
  tickerCusip: 'testTickerCusip2',
  category: 'testCategory2',
};
const current = securityId2;
const list = [securityId1, securityId2];
const emptySecurities = {
  current: null,
  list: [],
};
const securities = {
  current,
  list,
  [securityId1]: security1,
  [securityId2]: security2,
};
const correctedSecurities = {
  current: securityId1,
  list,
  [securityId1]: security1,
  [securityId2]: security2,
};
const emptyResponse = {
  rows: [],
};
const joinResponse = {
  rows: [
    {
      security_id: securityId1,
      security_order: 0,
    },
    {
      security_id: securityId2,
      security_order: 1,
    },
  ],
};
const securityResponse = {
  rows: [
    {
      security_id: securityId1,
      name: security1.name,
      exchange: security1.exchange,
      ticker_cusip: security1.tickerCusip,
      category: security1.category,
    },
    {
      security_id: securityId2,
      name: security2.name,
      exchange: security2.exchange,
      ticker_cusip: security2.tickerCusip,
      category: security2.category,
    },
  ],
};
const userResponse = {
  rows: [
    {
      security_current: securityId2,
    },
  ],
};
const wrongUserResponse = {
  rows: [
    {
      security_current: securityId3,
    },
  ],
};

describe('functions', () => {
  describe('db', () => {
    describe('getSecurities', () => {
      afterEach(() => {
        global.pool.query.mockReset();
      });

      it('fails and returns unexpected error, when global.pool.query throws error first query', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.reject(error);
        });

        try {
          await getSecurities(userId);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
        expect(global.pool.query).toHaveBeenCalledTimes(1);
      });

      it('fails and returns unexpected error, when global.pool.query throws error second query', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(joinResponse);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([list]);
          return Promise.reject(error);
        });

        try {
          await getSecurities(userId);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
        expect(global.pool.query).toHaveBeenCalledTimes(2);
      });

      it('fails and returns unexpected error, when global.pool.query throws error second query', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(joinResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([list]);
          return Promise.resolve(securityResponse);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.reject(error);
        });

        try {
          await getSecurities(userId);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }

        expect(global.pool.query).toHaveBeenCalledTimes(3);
      });

      it('returns empty securities object, when security table query is empty', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(emptyResponse);
        });

        const result = await getSecurities(userId);

        expect(result).toEqual({ securities: emptySecurities });
        expect(global.pool.query).toHaveBeenCalledTimes(1);
      });

      it('returns corrected security_current, when user table query is empty', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(joinResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([list]);
          return Promise.resolve(securityResponse);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(emptyResponse);
        });

        const result = await getSecurities(userId);

        expect(result).toEqual({ securities: correctedSecurities });
        expect(global.pool.query).toHaveBeenCalledTimes(3);
      });

      it('returns corrected security_current, when user table response has security_current not in list', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(joinResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([list]);
          return Promise.resolve(securityResponse);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(wrongUserResponse);
        });

        const result = await getSecurities(userId);

        expect(result).toEqual({ securities: correctedSecurities });
        expect(global.pool.query).toHaveBeenCalledTimes(3);
      });

      it('returns correct securities object', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(joinResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([list]);
          return Promise.resolve(securityResponse);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(userResponse);
        });

        const result = await getSecurities(userId);

        expect(result).toEqual({ securities });
        expect(global.pool.query).toHaveBeenCalledTimes(3);
      });
    });
  });
});
