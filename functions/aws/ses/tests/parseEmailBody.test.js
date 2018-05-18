const AWS = require('aws-sdk'); // eslint-disable-line

const { parseEmailBody } = require('../parseEmailBody');

const getObject = jest.fn();

AWS.S3 = jest.fn(() => ({
  getObject,
}));

const bucketParams = {
  Bucket: 'testBucket',
  Key: 'testKey',
};

describe('functions', () => {
  describe('aws', () => {
    describe('ses', () => {
      describe('parseEmailBody', () => {
        afterEach(() => {
          getObject.mockReset();
        });

        it('fails and returns callback error', async () => {
          const error = {
            code: 'testCode',
            message: 'testMessage',
          };
          getObject.mockImplementation((params, callback) => {
            expect(params).toEqual(bucketParams);
            callback(error);
          });

          try {
            await parseEmailBody(bucketParams);
          } catch (errorCatch) {
            expect(errorCatch).toEqual(error);
          }
        });

        it('fails and returns unexpected error, missing s3 get object', async () => {
          const emptyResult = {};
          getObject.mockImplementation((params, callback) => {
            expect(params).toEqual(bucketParams);
            callback(null, emptyResult);
          });

          try {
            await parseEmailBody(bucketParams);
          } catch (errorCatch) {
            expect(errorCatch).toMatchSnapshot();
          }
        });

        it('fails and returns unexpected error, text/plain content-type not available', async () => {
          const result = {
            Body: 'Content-Type: text/html;',
          };
          getObject.mockImplementation((params, callback) => {
            expect(params).toEqual(bucketParams);
            callback(null, result);
          });

          try {
            await parseEmailBody(bucketParams);
          } catch (errorCatch) {
            expect(errorCatch).toMatchSnapshot();
          }
        });

        it('fails and returns unexpected error, unable to parse body', async () => {
          const result = {
            Body: 'Content-Type: text/plain; test',
          };
          getObject.mockImplementation((params, callback) => {
            expect(params).toEqual(bucketParams);
            callback(null, result);
          });

          try {
            await parseEmailBody(bucketParams);
          } catch (errorCatch) {
            expect(errorCatch).toMatchSnapshot();
          }
        });

        it('fails and returns unexpected error, unable to parse tickerCusip', async () => {
          const result = {
            Body: `Content-Type: text/plain;\n
            \n\n
            test`,
          };
          getObject.mockImplementation((params, callback) => {
            expect(params).toEqual(bucketParams);
            callback(null, result);
          });

          try {
            await parseEmailBody(bucketParams);
          } catch (errorCatch) {
            expect(errorCatch).toMatchSnapshot();
          }
        });
      });
    });
  });
});
