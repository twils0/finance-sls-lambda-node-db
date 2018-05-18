const { updateUser } = require('../updateUser');
const uuidv4 = require('uuid/v4');

const newVerificationId = '43663f5d-a27c-4e1f-8d22-0b0f42b1b27a';

jest.mock('uuid/v4', () => jest.fn());
uuidv4.mockReturnValue(newVerificationId);

global.pool = {
  query: jest.fn(),
};

const oldVerificationId = '7cfcfcc9-0e50-4a0b-90a7-d340a2e51960';
const userId = 'testUserID';
const email = 'test1@test.com';
const emailAdditional = 'test2@test.com';
const emailBody = {
  email,
};
const emailEmailAdditionalNullBody = {
  email,
  emailAdditional: '',
};
const emailAdditionalBody = {
  emailAdditional,
};
const emailEmailAdditionalBody = {
  email,
  emailAdditional,
};
const emailVerifiedBody = {
  emailVerified: 'false',
};
const emailAdditionalVerifiedBody = {
  emailVerified: 'true',
  emailAdditionalVerified: 'false',
};
const emailVerifiedEmailAdditionalVerifiedBody = {
  emailVerified: 'false',
  emailAdditionalVerified: 'false',
};
const verificationIdBody = {
  verificationId: newVerificationId,
};

describe('functions', () => {
  describe('db', () => {
    describe('updateUser', () => {
      afterEach(() => {
        global.pool.query.mockReset();
      });

      it('fails and returns unexpected error, when global.pool.query throws error, when provided email and null email additional', async () => {
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
          await updateUser(userId, emailEmailAdditionalNullBody);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }

        expect(global.pool.query).toHaveBeenCalledTimes(1);
      });

      it('correctly updates email, when provided email', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve({ rows: [{ email }] });
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, email]);
          return Promise.resolve(null);
        });

        const result = await updateUser(userId, emailBody);

        expect(global.pool.query).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
          username: email,
          emailVerificationId: null,
          emailAdditionalVerificationId: null,
        });
      });

      it('correctly updates email_additional, when provided emailAdditional', async () => {
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, emailAdditional]);
          return Promise.resolve({ rows: [{ email }] });
        });

        const result = await updateUser(userId, emailAdditionalBody);

        expect(global.pool.query).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
          username: email,
          emailVerificationId: null,
          emailAdditionalVerificationId: null,
        });
      });

      it('correctly updates email and email_additional, when provided email and emailAdditional', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve({ rows: [{ email }] });
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, email, emailAdditional]);
          return Promise.resolve(null);
        });

        const result = await updateUser(userId, emailEmailAdditionalBody);

        expect(global.pool.query).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
          username: email,
          emailVerificationId: null,
          emailAdditionalVerificationId: null,
        });
      });

      it('correctly updates email_ver, when provided emailVerified, db returns email_ver as null', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve({ rows: [{ email, email_ver: null }] });
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, newVerificationId]);
          return Promise.resolve({ username: email });
        });

        const result = await updateUser(userId, emailVerifiedBody);

        expect(global.pool.query).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
          username: email,
          emailVerificationId: newVerificationId,
          emailAdditionalVerificationId: null,
        });
      });

      it('correctly updates email_ver, when provided emailVerified, db returns exisitng email_ver', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve({ rows: [{ email, email_ver: oldVerificationId }] });
        });

        const result = await updateUser(userId, emailVerifiedBody);

        expect(global.pool.query).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
          username: email,
          emailVerificationId: oldVerificationId,
          emailAdditionalVerificationId: null,
        });
      });

      it('correctly updates email_additional_ver, when emailAdditionalVerified equals false, db returns email_additional_ver as null', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve({ rows: [{ email, email_additional_ver: null }] });
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, newVerificationId]);
          return Promise.resolve(null);
        });

        const result = await updateUser(userId, emailAdditionalVerifiedBody);

        expect(global.pool.query).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
          username: email,
          emailVerificationId: null,
          emailAdditionalVerificationId: newVerificationId,
        });
      });

      it('correctly updates email_additional_ver, when emailAdditionalVerified equals false, db returns existing email_additional_ver', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve({
            rows: [{ email, email_additional_ver: oldVerificationId }],
          });
        });

        const result = await updateUser(userId, emailAdditionalVerifiedBody);

        expect(global.pool.query).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
          username: email,
          emailVerificationId: null,
          emailAdditionalVerificationId: oldVerificationId,
        });
      });

      it('correctly updates email_ver and email_additional_ver, when provided emailVerified and emailAdditionalVerified, db returns email_ver and email_additional_ver as null', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve({
            rows: [{ email, email_ver: null, email_additional_ver: null }],
          });
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, newVerificationId, newVerificationId]);
          return Promise.resolve(null);
        });

        const result = await updateUser(userId, emailVerifiedEmailAdditionalVerifiedBody);

        expect(global.pool.query).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
          username: email,
          emailVerificationId: newVerificationId,
          emailAdditionalVerificationId: newVerificationId,
        });
      });

      it('correctly returns existing email_ver and email_additional_ver, when emailVerified and emailAdditionalVerified equal to false, db returns existing email_ver and email_additional_ver', async () => {
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve({
            rows: [
              {
                email,
                email_ver: newVerificationId,
                email_additional_ver: oldVerificationId,
              },
            ],
          });
        });

        const result = await updateUser(userId, emailVerifiedEmailAdditionalVerifiedBody);

        expect(global.pool.query).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
          username: email,
          emailVerificationId: newVerificationId,
          emailAdditionalVerificationId: oldVerificationId,
        });
      });

      it('correctly updates email_ver, when provided verificationId', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([newVerificationId]);
          return Promise.resolve({
            rows: [
              {
                user_id: userId,
              },
            ],
          });
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve({
            rows: [
              {
                email,
                email_ver: null,
                email_additional_ver: oldVerificationId,
              },
            ],
          });
        });

        const result = await updateUser(null, verificationIdBody);

        expect(global.pool.query).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
          username: email,
          emailVerificationId: null,
          emailAdditionalVerificationId: oldVerificationId,
        });
      });

      it('correctly updates email_additional_ver, when provided verificationId', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([newVerificationId]);
          return Promise.resolve({
            rows: [
              {
                user_id: userId,
              },
            ],
          });
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve({
            rows: [
              {
                email,
                email_ver: oldVerificationId,
                email_additional_ver: null,
              },
            ],
          });
        });

        const result = await updateUser(null, verificationIdBody);

        expect(global.pool.query).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
          username: email,
          emailVerificationId: oldVerificationId,
          emailAdditionalVerificationId: null,
        });
      });
    });
  });
});
