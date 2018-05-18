const { getUser } = require('../getUser');

global.pool = {
  query: jest.fn(),
};

const userId = 'testUserID';
const email = 'test@test.com';
const dbResponse = {
  rows: [
    {
      email,
    },
  ],
};

describe('functions', () => {
  describe('db', () => {
    describe('getUser', () => {
      afterEach(() => {
        global.pool.query.mockReset();
      });

      it('fails and returns unexpected error, when global.pool.query throws error, when provided userId', async () => {
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
          await getUser(userId);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
      });

      it('correctly returns email when provided userId', async () => {
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(dbResponse);
        });

        const result = await getUser(userId);

        expect(result).toEqual({ username: email });
      });
    });
  });
});
