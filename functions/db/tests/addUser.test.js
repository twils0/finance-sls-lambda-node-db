const { addUser } = require('../addUser');

global.pool = {
  query: jest.fn(),
};

const email = 'test1@test.com';
const emailAdditional = 'test2@test.com';
const userId = 'testUserID';
const emailPayload = {
  email,
};
const emailAdditionalPayload = {
  email,
  emailAdditional,
};
const dbResponse = {
  rows: [
    {
      user_id: userId,
    },
  ],
};

describe('functions', () => {
  describe('db', () => {
    describe('addUser', () => {
      afterEach(() => {
        global.pool.query.mockReset();
      });

      it('fails and returns unexpected error, when global.pool.query throws error, when provided email', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([email, null]);
          return Promise.reject(error);
        });

        try {
          await addUser(emailPayload);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
      });

      it('correctly adds email and returns userId, when provided email', async () => {
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([email, null]);
          return Promise.resolve(dbResponse);
        });

        const result = await addUser(emailPayload);

        expect(result).toEqual({ userId });
      });

      it('correctly adds email, emailAdditional, and returns userId, when provided email and emailAdditional', async () => {
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([email, emailAdditional]);
          return Promise.resolve(dbResponse);
        });

        const result = await addUser(emailAdditionalPayload);

        expect(result).toEqual({ userId });
      });
    });
  });
});
