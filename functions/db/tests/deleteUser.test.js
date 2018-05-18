const { deleteUser } = require('../deleteUser');

global.pool = {
  query: jest.fn(),
};

const userId = 'testUserID';

describe('functions', () => {
  describe('db', () => {
    describe('deleteUser', () => {
      afterEach(() => {
        global.pool.query.mockReset();
      });

      it('fails and returns unexpected error, when global.pool.query throws error on first query', async () => {
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
          await deleteUser(userId);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
      });

      it('fails and returns unexpected error, when global.pool.query throws error on second query', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(null);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.reject(error);
        });

        try {
          await deleteUser(userId);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
      });

      it('correctly returns user id', async () => {
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(null);
        });

        const result = await deleteUser(userId);

        expect(result).toEqual(null);
      });
    });
  });
});
