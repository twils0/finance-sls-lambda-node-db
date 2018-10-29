const AWS = require('aws-sdk'); // eslint-disable-line

const sendEmailExport = require('../sendEmail');

const sendEmailModule = sendEmailExport.sendEmail;

const sendEmail = jest.fn();

global.console.log = jest.fn();

AWS.SES = jest.fn(() => ({
  sendEmail,
}));

const fromEmail = 'support@dynamictriggers.com';
const fromDomain = 'test.com';
const subject = 'testSubject';
const body = 'testBody';
const emailAddresses = ['toTest0@test.com', 'toTest1@test.com'];

describe('functions', () => {
  describe('aws', () => {
    describe('ses', () => {
      describe('sendEmail', () => {
        afterEach(() => {
          global.console.log.mockReset();
          sendEmail.mockReset();
        });

        it('fails and returns Email Not Sent, no body', async () => {
          const email = {
            fromEmail,
            fromDomain,
            subject,
          };
          sendEmail.mockImplementation((params, callback) => callback(null, null));

          const result = await sendEmailModule(email, emailAddresses);

          expect(result).toEqual(null);
          expect(global.console.log).toMatchSnapshot();
        });

        it('fails and returns Email Not Sent, invalid fromEmail', async () => {
          const email = {
            fromEmail: 'test@test.com',
            fromDomain,
            subject,
            body,
          };
          sendEmail.mockImplementation((params, callback) => callback(null, null));

          const result = await sendEmailModule(email, emailAddresses);

          expect(result).toEqual(null);
          expect(global.console.log).toMatchSnapshot();
        });

        it('fails and returns Email Not Sent, no emailAddresses', async () => {
          const email = {
            fromEmail,
            fromDomain,
            subject,
            body,
          };

          sendEmail.mockImplementation((params, callback) => callback(null, null));

          const result = await sendEmailModule(email, null);

          expect(result).toEqual(null);
          expect(global.console.log).toMatchSnapshot();
        });

        it('sendEmail fails and returns unexpected error', async () => {
          const email = {
            fromEmail,
            fromDomain,
            subject,
            body,
          };
          const error = {
            code: 'testCode',
            message: 'testMessage',
          };

          sendEmail.mockImplementation((params, callback) => callback(error, null));

          const result = await sendEmailModule(email, emailAddresses);

          expect(result).toEqual(null);
          expect(global.console.log).toMatchSnapshot();
        });

        it('correctly sends emails', async () => {
          const email = {
            fromEmail,
            fromDomain,
            subject,
            body,
          };

          sendEmail.mockImplementation((params, callback) => callback(null, null));

          const result = await sendEmailModule(email, emailAddresses);

          expect(result).toEqual(null);
          expect(global.console.log).not.toBeCalled();
        });
      });
    });
  });
});
