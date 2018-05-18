const AWS = require('aws-sdk'); // eslint-disable-line

const sesConfig = require('../ses.config.json');

const sendEmailExport = require('../sendTemplatedEmail');

const sendEmailModule = sendEmailExport.sendTemplatedEmail;

const sendTemplatedEmail = jest.fn();

global.console.log = jest.fn();

AWS.SES = jest.fn(() => ({
  sendTemplatedEmail,
}));

const from = `${sesConfig.fromName} <${sesConfig.fromVerifiedEmail}>`;
const replyTo = `${sesConfig.replyToName} <${sesConfig.replyToVerifiedEmail}>`;

const template = 'verificationEmailTemplate';
const emailAddresses = ['toTest0@test.com', 'toTest1@test.com'];
const data = { test: 'testData' };

const expectedParamsData0 = {
  Template: template,
  Source: from,
  ReplyToAddresses: [replyTo],
  TemplateData: JSON.stringify(data),
  Destination: { ToAddresses: [emailAddresses[0]] },
};
const expectedParamsData1 = {
  Template: template,
  Source: from,
  ReplyToAddresses: [replyTo],
  TemplateData: JSON.stringify(data),
  Destination: { ToAddresses: [emailAddresses[1]] },
};
const expectedParamsNoData0 = {
  Template: template,
  Source: from,
  ReplyToAddresses: [replyTo],
  TemplateData: '',
  Destination: { ToAddresses: [emailAddresses[0]] },
};
const expectedParamsNoData1 = {
  Template: template,
  Source: from,
  ReplyToAddresses: [replyTo],
  TemplateData: '',
  Destination: { ToAddresses: [emailAddresses[1]] },
};

describe('functions', () => {
  describe('aws', () => {
    describe('ses', () => {
      describe('sendTemplatedEmail', () => {
        afterEach(() => {
          global.console.log.mockReset();
          sendTemplatedEmail.mockReset();
        });

        it('fails and console logs email not sent, no email addresses, error', async () => {
          const result = await sendEmailModule(template, data, []);

          expect(result).toEqual(null);
          await setTimeout(() => {}, 10); // work-around to test that logout is or is not fired
          expect(sendTemplatedEmail).not.toBeCalled();
          expect(global.console.log).toMatchSnapshot();
        });

        it('fails and console logs failed to send error, when sendTemplatedEmail throws error', async () => {
          const error = {
            code: 'testCode',
            message: 'testMessage',
          };
          sendTemplatedEmail.mockImplementationOnce((params, callback) => {
            expect(params).toEqual(expectedParamsData0);
            callback(error, null);
          });

          const result = await sendEmailModule(template, data, emailAddresses);

          expect(result).toEqual(null);
          await setTimeout(() => {}, 10); // work-around to test that logout is or is not fired
          expect(sendTemplatedEmail).toHaveBeenCalledTimes(2);
          expect(global.console.log).toMatchSnapshot();
        });

        it('correct sends emails when provided data', async () => {
          sendTemplatedEmail.mockImplementationOnce((params, callback) => {
            expect(params).toEqual(expectedParamsData0);
            callback(null, null);
          });
          sendTemplatedEmail.mockImplementationOnce((params, callback) => {
            expect(params).toEqual(expectedParamsData1);
            callback(null, null);
          });

          const result = await sendEmailModule(template, data, emailAddresses);

          expect(result).toEqual(null);
          await setTimeout(() => {}, 10); // work-around to test that logout is or is not fired
          expect(sendTemplatedEmail).toHaveBeenCalledTimes(2);
          expect(global.console.log).toMatchSnapshot();
        });

        it('correct sends emails when provided data', async () => {
          sendTemplatedEmail.mockImplementationOnce((params, callback) => {
            expect(params).toEqual(expectedParamsNoData0);
            callback(null, null);
          });
          sendTemplatedEmail.mockImplementationOnce((params, callback) => {
            expect(params).toEqual(expectedParamsNoData1);
            callback(null, null);
          });

          const result = await sendEmailModule(template, null, emailAddresses);

          expect(result).toEqual(null);
          expect(sendTemplatedEmail).toHaveBeenCalledTimes(2);
          expect(global.console.log).toMatchSnapshot();
        });
      });
    });
  });
});
