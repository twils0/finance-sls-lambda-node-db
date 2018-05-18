const { loadPool } = require('../../../../functions/db/loadPool');
const { parseS3SNSEvent } = require('../../../../functions/aws/ses/parseS3SNSEvent');
const { parseEmailBody } = require('../../../../functions/aws/ses/parseEmailBody');
const { getEmailAddresses } = require('../../../../functions/db/getEmailAddresses');
const { sendEmail } = require('../../../../functions/aws/ses/sendEmail');

const { forwardEmails } = require('../handler');

global.console.log = jest.fn();
jest.mock('../../../../functions/db/loadPool', () => ({
  loadPool: jest.fn(),
}));
jest.mock('../../../../functions/aws/ses/parseS3SNSEvent', () => ({
  parseS3SNSEvent: jest.fn(),
}));
jest.mock('../../../../functions/aws/ses/parseEmailBody', () => ({
  parseEmailBody: jest.fn(),
}));
jest.mock('../../../../functions/db/getEmailAddresses', () => ({
  getEmailAddresses: jest.fn(),
}));
jest.mock('../../../../functions/aws/ses/sendEmail', () => ({
  sendEmail: jest.fn(),
}));
jest.mock('../../../../functions/aws/ses/sendTemplatedEmail', () => ({
  sendTemplatedEmail: jest.fn(),
}));
jest.mock('../../../../functions/errorResponse', () => ({
  errorResponse: jest.fn(error => error),
}));

const domain = 'test.com';
const email = `test@${domain}`;
const subject = 'testSubject';
const message = {
  mail: {
    commonHeaders: {
      from: [`testFrom <${email}>`],
      subject,
    },
  },
  receipt: {
    action: {
      bucketName: 'testBucket',
      objectKey: 'testKey',
    },
  },
};

const event = {
  Records: [
    {
      Sns: {
        Message: JSON.stringify(message),
      },
    },
  ],
};
global.pool = { test: 'testPool' };
const fromEmail = email;
const fromDomain = domain;
const bucketParams = {
  Bucket: message.receipt.action.bucketName,
  Key: message.receipt.action.objectKey,
};
const tickerCusip = 'testTickerCusip';
const body = 'testBody';
const emailBody = { tickerCusip, body };
const emailAddresses = ['toTest0@test.com', 'toTest1@test.com'];

const response = {
  status: 200,
  body: {
    message: 'success',
  },
};
const callback = jest.fn();

describe('handlers', () => {
  describe('sns', () => {
    describe('forwardEmails', () => {
      afterEach(() => {
        loadPool.mockReset();
        parseS3SNSEvent.mockReset();
        parseEmailBody.mockReset();
        getEmailAddresses.mockReset();
        sendEmail.mockReset();
        // sendTemplatedEmail.mockReset();
        global.console.log.mockReset();
        callback.mockReset();
      });

      it('fails and returns error, when loadPool throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.reject(error));

        await forwardEmails(event, null, callback);

        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when parseS3SNSEvent throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.resolve());
        parseS3SNSEvent.mockReturnValue(Promise.reject(error));

        await forwardEmails(event, null, callback);

        expect(parseS3SNSEvent).toBeCalledWith(event);
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when fromEmail is missing', async () => {
        loadPool.mockReturnValue(Promise.resolve());
        parseS3SNSEvent.mockReturnValue(Promise.resolve({
          fromEmail: null,
          fromDomain,
          bucketParams,
        }));

        await forwardEmails(event, null, callback);

        expect(parseS3SNSEvent).toBeCalledWith(event);
        expect(callback).toMatchSnapshot();
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when fromDomain is invalid', async () => {
        loadPool.mockReturnValue(Promise.resolve());
        parseS3SNSEvent.mockReturnValue(Promise.resolve({ fromEmail, fromDomain: 'error.com', bucketParams }));

        await forwardEmails(event, null, callback);

        expect(parseS3SNSEvent).toBeCalledWith(event);
        expect(callback).toMatchSnapshot();
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when parseEmailBody throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.resolve());
        parseS3SNSEvent.mockReturnValue(Promise.resolve({
          fromEmail,
          fromDomain,
          subject,
          bucketParams,
        }));
        parseEmailBody.mockReturnValue(Promise.reject(error));

        await forwardEmails(event, null, callback);

        expect(parseS3SNSEvent).toBeCalledWith(event);
        expect(parseEmailBody).toBeCalledWith(bucketParams);
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when getEmailAddresses throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.resolve());
        parseS3SNSEvent.mockReturnValue(Promise.resolve({
          fromEmail,
          fromDomain,
          subject,
          bucketParams,
        }));
        parseEmailBody.mockReturnValue(Promise.resolve(emailBody));
        getEmailAddresses.mockReturnValue(Promise.reject(error));

        await forwardEmails(event, null, callback);

        expect(parseS3SNSEvent).toBeCalledWith(event);
        expect(parseEmailBody).toBeCalledWith(bucketParams);
        expect(getEmailAddresses).toBeCalledWith(tickerCusip);
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('fails and returns error, when sendEmail throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.resolve());
        parseS3SNSEvent.mockReturnValue(Promise.resolve({
          fromEmail,
          fromDomain,
          subject,
          bucketParams,
        }));
        parseEmailBody.mockReturnValue(Promise.resolve(emailBody));
        getEmailAddresses.mockReturnValue(Promise.resolve({ emailAddresses }));
        sendEmail.mockReturnValue(Promise.reject(error));

        await forwardEmails(event, null, callback);

        expect(parseS3SNSEvent).toBeCalledWith(event);
        expect(parseEmailBody).toBeCalledWith(bucketParams);
        expect(getEmailAddresses).toBeCalledWith(tickerCusip);
        expect(sendEmail).toBeCalledWith(
          {
            fromEmail,
            fromDomain,
            subject,
            body,
          },
          emailAddresses,
        );
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });

      it('correctly sends emails', async () => {
        loadPool.mockReturnValue(Promise.resolve());
        parseS3SNSEvent.mockReturnValue(Promise.resolve({
          fromEmail,
          fromDomain,
          subject,
          bucketParams,
        }));
        parseEmailBody.mockReturnValue(Promise.resolve(emailBody));
        getEmailAddresses.mockReturnValue(Promise.resolve({ emailAddresses }));
        sendEmail.mockReturnValue(Promise.resolve());

        await forwardEmails(event, null, callback);

        expect(parseS3SNSEvent).toBeCalledWith(event);
        expect(parseEmailBody).toBeCalledWith(bucketParams);
        expect(getEmailAddresses).toBeCalledWith(tickerCusip);
        expect(sendEmail).toBeCalledWith(
          {
            fromEmail,
            fromDomain,
            subject,
            body,
          },
          emailAddresses,
        );
        expect(callback).toBeCalledWith(null, response);
        expect(global.console.log).toMatchSnapshot();
      });

      /*
      it('fails and returns error, when sendTemplatedEmail throws error', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        loadPool.mockReturnValue(Promise.resolve());
        parseS3SNSEvent.mockReturnValue(Promise.resolve({ fromEmail, fromDomain, bucketParams }));
        parseEmailBody.mockReturnValue(Promise.resolve(emailBody));
        getEmailAddresses.mockReturnValue(Promise.resolve({ emailAddresses }));
        sendTemplatedEmail.mockReturnValue(Promise.reject(error));

        await forwardEmails(event, null, callback);

        expect(parseS3SNSEvent).toBeCalledWith(event);
        expect(parseEmailBody).toBeCalledWith(bucketParams);
        expect(getEmailAddresses).toBeCalledWith(tickerCusip);
        expect(sendTemplatedEmail).toBeCalledWith(template, null, emailAddresses);
        expect(callback).toBeCalledWith(error, response);
        expect(global.console.log).toMatchSnapshot();
      });


      it('correctly sends emails', async () => {
        loadPool.mockReturnValue(Promise.resolve());
        parseS3SNSEvent.mockReturnValue(Promise.resolve({ fromEmail, fromDomain, bucketParams }));
        parseEmailBody.mockReturnValue(Promise.resolve(emailBody));
        getEmailAddresses.mockReturnValue(Promise.resolve({ emailAddresses }));
        sendTemplatedEmail.mockReturnValue(Promise.resolve());

        await forwardEmails(event, null, callback);

        expect(parseS3SNSEvent).toBeCalledWith(event);
        expect(parseEmailBody).toBeCalledWith(bucketParams);
        expect(getEmailAddresses).toBeCalledWith(tickerCusip);
        expect(sendTemplatedEmail).toBeCalledWith(template, null, emailAddresses);
        expect(callback).toBeCalledWith(null, response);
        expect(global.console.log).toMatchSnapshot();
      });
      */
    });
  });
});
