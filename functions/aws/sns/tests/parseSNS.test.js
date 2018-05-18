const { parseSNS } = require('../parseSNS');

describe('functions', () => {
  describe('aws', () => {
    describe('sns', () => {
      describe('parseSNS', () => {
        it('fails and returns unexpected error, invalid sns event', async () => {
          const emptyEvent = {};

          try {
            await parseSNS(JSON.stringify(emptyEvent));
          } catch (errorCatch) {
            expect(errorCatch).toMatchSnapshot();
          }
        });

        it('correctly parses sns event', async () => {
          const message = { test: 'testMessage' };
          const event = {
            Records: [
              {
                Sns: {
                  Message: JSON.stringify(message),
                },
              },
            ],
          };

          const payload = await parseSNS(event);

          expect(payload).toEqual(message);
        });
      });
    });
  });
});
