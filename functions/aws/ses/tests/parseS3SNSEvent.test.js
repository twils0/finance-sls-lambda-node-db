const { parseS3SNSEvent } = require('../parseS3SNSEvent');

describe('functions', () => {
  describe('aws', () => {
    describe('ses', () => {
      describe('parseS3SNSEvent', () => {
        it('fails and returns unexpected error, empty sns event', async () => {
          const emptyEvent = {};

          try {
            await parseS3SNSEvent(JSON.stringify(emptyEvent));
          } catch (errorCatch) {
            expect(errorCatch).toMatchSnapshot();
          }
        });

        it('fails and returns unexpected error, invalid sns message for s3 email event', async () => {
          const wrongEvent = {
            Records: [
              {
                Sns: {
                  Message: {},
                },
              },
            ],
          };

          try {
            await parseS3SNSEvent(JSON.stringify(wrongEvent));
          } catch (errorCatch) {
            expect(errorCatch).toMatchSnapshot();
          }
        });

        it('fails and returns unexpected error, unable to find from', async () => {
          const message = {
            mail: {
              commonHeaders: {
                from: null,
                subject: 'testSubject',
              },
            },
            receipt: {
              action: {},
            },
          };
          const wrongEvent = {
            Records: [
              {
                Sns: {
                  Message: JSON.stringify(message),
                },
              },
            ],
          };

          try {
            await parseS3SNSEvent(wrongEvent);
          } catch (errorCatch) {
            expect(errorCatch).toMatchSnapshot();
          }
        });

        it('fails and returns unexpected error, unable to parse from email', async () => {
          const message = {
            mail: {
              commonHeaders: {
                from: ['testFrom'],
                subject: 'testSubject',
              },
            },
            receipt: {
              action: {},
            },
          };
          const wrongEvent = {
            Records: [
              {
                Sns: {
                  Message: JSON.stringify(message),
                },
              },
            ],
          };

          try {
            await parseS3SNSEvent(wrongEvent);
          } catch (errorCatch) {
            expect(errorCatch).toMatchSnapshot();
          }
        });

        it('fails and returns unexpected error, unable to parse from domain', async () => {
          const message = {
            mail: {
              commonHeaders: {
                from: ['testFrom <test>'],
                subject: 'testSubject',
              },
            },
            receipt: {
              action: {},
            },
          };
          const wrongEvent = {
            Records: [
              {
                Sns: {
                  Message: JSON.stringify(message),
                },
              },
            ],
          };

          try {
            await parseS3SNSEvent(wrongEvent);
          } catch (errorCatch) {
            expect(errorCatch).toMatchSnapshot();
          }
        });

        it('fails and returns unexpected error, unable to find bucketName', async () => {
          const message = {
            mail: {
              commonHeaders: {
                from: ['testFrom <test@test.com>'],
                subject: 'testSubject',
              },
            },
            receipt: {
              action: {
                bucketName: null,
                objectKey: 'testKey',
              },
            },
          };
          const wrongEvent = {
            Records: [
              {
                Sns: {
                  Message: JSON.stringify(message),
                },
              },
            ],
          };

          try {
            await parseS3SNSEvent(wrongEvent);
          } catch (errorCatch) {
            expect(errorCatch).toMatchSnapshot();
          }
        });

        it('fails and returns unexpected error, unable to find objectKey', async () => {
          const message = {
            mail: {
              commonHeaders: {
                from: ['testFrom <test@test.com>'],
                subject: 'testSubject',
              },
            },
            receipt: {
              action: {
                bucketName: 'testBucket',
                objectKey: null,
              },
            },
          };
          const wrongEvent = {
            Records: [
              {
                Sns: {
                  Message: JSON.stringify(message),
                },
              },
            ],
          };

          try {
            await parseS3SNSEvent(wrongEvent);
          } catch (errorCatch) {
            expect(errorCatch).toMatchSnapshot();
          }
        });

        it('correctly parses s3 sns event', async () => {
          const domain = 'test.com';
          const email = `test@${domain}`;
          const message = {
            mail: {
              commonHeaders: {
                from: [`testFrom <${email}>`],
                subject: 'testSubject',
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

          const {
            fromEmail,
            fromDomain,
            bucketParams: { Bucket, Key },
          } = await parseS3SNSEvent(event);

          expect(fromEmail).toEqual(email);
          expect(fromDomain).toEqual(domain);
          expect(Bucket).toEqual(message.receipt.action.bucketName);
          expect(Key).toEqual(message.receipt.action.objectKey);
        });
      });
    });
  });
});
