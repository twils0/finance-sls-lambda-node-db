const { getEmailAddresses } = require('../getEmailAddresses');

global.pool = {
  query: jest.fn(),
};

const tickerCusip = 'testTickerCusip';
const securityId = 'testSecurityID';
const email1 = 'test1@test.com';
const emailAdditional1 = 'test_add1@test.com';
const email2 = 'test2@test.com';
const emailAddresses = [email1, emailAdditional1, email2];
const emptyResponse = {
  rows: [],
};
const securityReponse = {
  rows: [
    {
      security_id: securityId,
    },
  ],
};
const joinResponse = {
  rows: [
    {
      email: email1,
      email_additional: emailAdditional1,
    },
    {
      email: email2,
    },
  ],
};

describe('functions', () => {
  describe('db', () => {
    describe('getEmailAddresses', () => {
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
          expect(valuesArray).toEqual([tickerCusip]);
          return Promise.reject(error);
        });

        try {
          await getEmailAddresses(tickerCusip);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
      });

      it('fails and returns unexpected error, when security table query is empty', async () => {
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([tickerCusip]);
          return Promise.resolve(emptyResponse);
        });

        try {
          await getEmailAddresses(tickerCusip);
        } catch (errorCatch) {
          expect(errorCatch).toMatchSnapshot();
        }
      });

      it('fails and returns unexpected error, when global.pool.query throws error second query', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([tickerCusip]);
          return Promise.resolve(securityReponse);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([securityId]);
          return Promise.reject(error);
        });

        try {
          await getEmailAddresses(tickerCusip);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
      });

      it('returns an empty array, when join table query is empty', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([tickerCusip]);
          return Promise.resolve(securityReponse);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([securityId]);
          return Promise.resolve(emptyResponse);
        });

        const result = await getEmailAddresses(tickerCusip);

        expect(result).toEqual({ emailAddresses: [] });
      });

      it('correctly returns email addresses', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([tickerCusip]);
          return Promise.resolve(securityReponse);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([securityId]);
          return Promise.resolve(joinResponse);
        });

        const result = await getEmailAddresses(tickerCusip);

        expect(result).toEqual({ emailAddresses });
      });
    });
  });
});
