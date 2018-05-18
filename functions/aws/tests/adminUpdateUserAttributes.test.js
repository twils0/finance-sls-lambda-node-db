const AWS = require('aws-sdk'); // eslint-disable-line
const awsConfig = require('../aws.config.json');

const adminUpdateUserAttributesExport = require('../adminUpdateUserAttributes');

const adminUpdateUserAttributesModule = adminUpdateUserAttributesExport.adminUpdateUserAttributes;

const adminUpdateUserAttributes = jest.fn();

AWS.CognitoIdentityServiceProvider = jest.fn(() => ({
  adminUpdateUserAttributes,
}));

const name = 'testName';
const phone = '+12395550000';
const email = 'test1@test.com';
const newEmail = 'test2@test.com';
const emailAdditional = 'test3@test.com';
const emailVerified = true;
const emailAdditionalVerified = false;

describe('functions', () => {
  describe('aws', () => {
    describe('adminUpdateUserAttributes', () => {
      afterEach(() => {
        adminUpdateUserAttributes.mockReset();
      });

      it('throws an unexpected callback error', async () => {
        const updatePayload = {
          emailAdditional,
        };
        const updateParams = {
          Username: email,
          UserPoolId: awsConfig.cognito.userPoolId,
          UserAttributes: [
            {
              Name: 'custom:email_additional',
              Value: emailAdditional,
            },
            {
              Name: 'custom:email_additional_ver',
              Value: 'false',
            },
          ],
        };
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        adminUpdateUserAttributes.mockImplementation((params, callback) => {
          expect(params).toEqual(updateParams);
          callback(error);
        });

        try {
          await adminUpdateUserAttributesModule(email, updatePayload);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
      });

      it('correctly resolves cognito sign up, with email param', async () => {
        const updatePayload = {
          email: newEmail,
        };
        const updateParams = {
          Username: email,
          UserPoolId: awsConfig.cognito.userPoolId,
          UserAttributes: [
            {
              Name: 'email',
              Value: newEmail,
            },
            {
              Name: 'email_verified',
              Value: 'true',
            },
            {
              Name: 'custom:email_ver',
              Value: 'false',
            },
          ],
        };
        adminUpdateUserAttributes.mockImplementation((params, callback) => {
          expect(params).toEqual(updateParams);
          callback(null, null);
        });

        const result = await adminUpdateUserAttributesModule(email, updatePayload);

        expect(result).toEqual(null);
      });

      it('correctly resolves cognito sign up, with email additional param', async () => {
        const updatePayload = {
          emailAdditional,
        };
        const updateParams = {
          Username: email,
          UserPoolId: awsConfig.cognito.userPoolId,
          UserAttributes: [
            {
              Name: 'custom:email_additional',
              Value: emailAdditional,
            },
            {
              Name: 'custom:email_additional_ver',
              Value: 'false',
            },
          ],
        };
        adminUpdateUserAttributes.mockImplementation((params, callback) => {
          expect(params).toEqual(updateParams);
          callback(null, null);
        });

        const result = await adminUpdateUserAttributesModule(email, updatePayload);

        expect(result).toEqual(null);
      });

      it('correctly resolves cognito sign up, with name param', async () => {
        const updatePayload = {
          name,
        };
        const updateParams = {
          Username: email,
          UserPoolId: awsConfig.cognito.userPoolId,
          UserAttributes: [
            {
              Name: 'name',
              Value: name,
            },
          ],
        };
        adminUpdateUserAttributes.mockImplementation((params, callback) => {
          expect(params).toEqual(updateParams);
          callback(null, null);
        });

        const result = await adminUpdateUserAttributesModule(email, updatePayload);

        expect(result).toEqual(null);
      });

      it('correctly resolves cognito sign up, with phone param', async () => {
        const updatePayload = {
          phone,
        };
        const updateParams = {
          Username: email,
          UserPoolId: awsConfig.cognito.userPoolId,
          UserAttributes: [
            {
              Name: 'phone_number',
              Value: phone,
            },
            {
              Name: 'phone_number_verified',
              Value: 'false',
            },
          ],
        };
        adminUpdateUserAttributes.mockImplementation((params, callback) => {
          expect(params).toEqual(updateParams);
          callback(null, null);
        });

        const result = await adminUpdateUserAttributesModule(email, updatePayload);

        expect(result).toEqual(null);
      });

      it('correctly resolves cognito sign up, with email additional and email verified params', async () => {
        const updatePayload = {
          emailAdditional,
          emailVerified,
        };
        const updateParams = {
          Username: email,
          UserPoolId: awsConfig.cognito.userPoolId,
          UserAttributes: [
            {
              Name: 'custom:email_additional',
              Value: emailAdditional,
            },
            {
              Name: 'custom:email_additional_ver',
              Value: 'false',
            },
            {
              Name: 'custom:email_ver',
              Value: JSON.stringify(emailVerified),
            },
          ],
        };
        adminUpdateUserAttributes.mockImplementation((params, callback) => {
          expect(params).toEqual(updateParams);
          callback(null, null);
        });

        const result = await adminUpdateUserAttributesModule(email, updatePayload);

        expect(result).toEqual(null);
      });

      it('correctly resolves cognito sign up, with email verified param', async () => {
        const updatePayload = {
          emailVerified,
        };
        const updateParams = {
          Username: email,
          UserPoolId: awsConfig.cognito.userPoolId,
          UserAttributes: [
            {
              Name: 'custom:email_ver',
              Value: JSON.stringify(emailVerified),
            },
          ],
        };
        adminUpdateUserAttributes.mockImplementation((params, callback) => {
          expect(params).toEqual(updateParams);
          callback(null, null);
        });

        const result = await adminUpdateUserAttributesModule(email, updatePayload);

        expect(result).toEqual(null);
      });

      it('correctly resolves cognito sign up, with email additional verified param', async () => {
        const updatePayload = {
          emailAdditionalVerified,
        };
        const updateParams = {
          Username: email,
          UserPoolId: awsConfig.cognito.userPoolId,
          UserAttributes: [
            {
              Name: 'custom:email_additional_ver',
              Value: JSON.stringify(emailAdditionalVerified),
            },
          ],
        };
        adminUpdateUserAttributes.mockImplementation((params, callback) => {
          expect(params).toEqual(updateParams);
          callback(null, null);
        });

        const result = await adminUpdateUserAttributesModule(email, updatePayload);

        expect(result).toEqual(null);
      });
    });
  });
});
