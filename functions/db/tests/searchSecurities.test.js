const { searchSecurities } = require('../searchSecurities');

global.pool = {
  query: jest.fn(),
};

const query = {
  search: 'testSearch',
};
const searchValue = `${query.search}:*`;
const security1 = {
  id: 'testSecurityID1',
  name: 'testName1',
  exchange: 'testExchange1',
  tickerCusip: 'testTickerCusip1',
  category: 'testCategory1',
};
const security2 = {
  id: 'testSecurityID2',
  name: 'testName2',
  exchange: 'testExchange2',
  tickerCusip: 'testTickerCusip2',
  category: 'testCategory2',
};
const securities = [security1, security2];
const dbResponse = {
  rows: [
    {
      security_id: security1.id,
      name: security1.name,
      exchange: security1.exchange,
      ticker_cusip: security1.tickerCusip,
      category: security1.category,
    },
    {
      security_id: security2.id,
      name: security2.name,
      exchange: security2.exchange,
      ticker_cusip: security2.tickerCusip,
      category: security2.category,
    },
  ],
};

describe('functions', () => {
  describe('db', () => {
    describe('searchSecurities', () => {
      afterEach(() => {
        global.pool.query.mockReset();
      });

      it('fails and returns unexpected error, when global.pool.query throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([searchValue]);
          return Promise.reject(error);
        });

        try {
          await searchSecurities(query);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
      });

      it('correctly returns securities array', async () => {
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([searchValue]);
          return Promise.resolve(dbResponse);
        });

        const result = await searchSecurities(query);

        expect(result).toEqual({ securities });
      });
    });
  });
});
