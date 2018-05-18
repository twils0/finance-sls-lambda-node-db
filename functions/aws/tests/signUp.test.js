const AWS = require('aws-sdk'); // eslint-disable-line
const awsConfig = require('../aws.config.json');

const signUpExport = require('../signUp');

const signUpModule = signUpExport.signUp;

const signUp = jest.fn();

AWS.CognitoIdentityServiceProvider = jest.fn(() => ({
  signUp,
}));

const email = 'test@test.com';
const password = 'testPassword1!';
const phone = '+12395550000';
const name = 'testName';
const customerId = 'testCustomerID';
const userId = 'testUserID';
const signUpPayload = {
  email,
  password,
  phone,
  name,
  customerId,
  userId,
};
const signUpParams = {
  ClientId: awsConfig.cognitoSignUp.clientId,
  Username: email,
  Password: password,
  UserAttributes: [
    {
      Name: 'email',
      Value: email,
    },
    {
      Name: 'phone_number',
      Value: phone,
    },
    {
      Name: 'name',
      Value: name,
    },
    {
      Name: 'custom:stripe_customer_id',
      Value: customerId,
    },
    {
      Name: 'custom:user_id',
      Value: userId,
    },
  ],
};

describe('functions', () => {
  describe('aws', () => {
    describe('signUp', () => {
      afterEach(() => {
        signUp.mockReset();
      });

      it('throws an unexpected callback error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        signUp.mockImplementation((params, callback) => {
          expect(params).toEqual(signUpParams);
          callback(error);
        });

        try {
          await signUpModule(signUpPayload);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
      });

      it('correctly resolves cognito sign up', async () => {
        signUp.mockImplementation((params, callback) => {
          expect(params).toEqual(signUpParams);
          callback(null, null);
        });
        const result = await signUpModule(signUpPayload);

        expect(result).toEqual(null);
      });
    });
  });
});
