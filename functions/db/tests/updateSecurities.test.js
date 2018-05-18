const { updateSecurities } = require('../updateSecurities');

global.pool = {
  query: jest.fn(),
};

const userId = 'testUserID';
const securityId1 = 'testSecurityID1';
const securityId2 = 'testSecurityID2';
const securityId3 = 'testSecurityID3';
const body = {
  current: securityId2,
  list: [securityId1, securityId2, securityId3],
};
const indexArray = body.list.map((id, index) => index);
const emptyResponse = {
  rows: [],
};
const noMatchUserResponse = {
  rows: [
    {
      security_current: securityId1,
    },
  ],
};
const matchUserResponse = {
  rows: [
    {
      security_current: securityId2,
    },
  ],
};
const noMatchJoinResponse = {
  rows: [
    {
      security_id: securityId1,
    },
    {
      security_id: securityId2,
    },
  ],
};
const matchJoinResponse = {
  rows: [
    {
      security_id: securityId1,
    },
    {
      security_id: securityId2,
    },
    {
      security_id: securityId3,
    },
  ],
};

describe('functions', () => {
  describe('db', () => {
    describe('updateSecurities', () => {
      afterEach(() => {
        global.pool.query.mockReset();
      });

      it('fails and returns unexpected error, when global.pool.query throws error first query', async () => {
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
          await updateSecurities(userId, body);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
      });

      it('fails and returns unexpected error, when global.pool.query throws error second query', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(noMatchUserResponse);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.reject(error);
        });

        try {
          await updateSecurities(userId, body);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
      });

      it('fails and returns unexpected error, when global.pool.query throws error third query', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(noMatchUserResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(noMatchJoinResponse);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, body.current]);
          return Promise.reject(error);
        });

        try {
          await updateSecurities(userId, body);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
      });

      it('fails and returns unexpected error, when global.pool.query throws error fourth query', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(noMatchUserResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(noMatchJoinResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, body.current]);
          return Promise.resolve(null);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.reject(error);
        });

        try {
          await updateSecurities(userId, body);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
      });

      it('fails and returns unexpected error, when global.pool.query throws error fifth query', async () => {
        const error = {
          code: 'testCode',
          message: 'testMessage',
        };
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(noMatchUserResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(noMatchJoinResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, body.current]);
          return Promise.resolve(null);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(null);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, body.list, indexArray]);
          return Promise.reject(error);
        });

        try {
          await updateSecurities(userId, body);
        } catch (errorCatch) {
          expect(errorCatch).toEqual(error);
        }
      });

      it('updates current security, when user table response is empty', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(emptyResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(matchJoinResponse);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, body.current]);
          return Promise.resolve(null);
        });

        const result = await updateSecurities(userId, body);

        expect(result).toEqual(null);
        expect(global.pool.query).toHaveBeenCalledTimes(3);
      });

      it('updates current security, when securityCurrent does not match', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(noMatchUserResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(matchJoinResponse);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, body.current]);
          return Promise.resolve(null);
        });

        const result = await updateSecurities(userId, body);

        expect(result).toEqual(null);
        expect(global.pool.query).toHaveBeenCalledTimes(3);
      });

      it('updates list, when join table response is empty', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(matchUserResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(emptyResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(null);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, body.list, indexArray]);
          return Promise.resolve(null);
        });

        const result = await updateSecurities(userId, body);

        expect(result).toEqual(null);
        expect(global.pool.query).toHaveBeenCalledTimes(4);
      });

      it('updates list, when joinList does not match', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(matchUserResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(noMatchJoinResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(null);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, body.list, indexArray]);
          return Promise.resolve(null);
        });

        const result = await updateSecurities(userId, body);

        expect(result).toEqual(null);
        expect(global.pool.query).toHaveBeenCalledTimes(4);
      });

      it('updates current security and list, when security_current and joinList do not match in each case', async () => {
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(noMatchUserResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(noMatchJoinResponse);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, body.current]);
          return Promise.resolve(null);
        });
        global.pool.query.mockImplementationOnce((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId]);
          return Promise.resolve(null);
        });
        global.pool.query.mockImplementation((dbString, valuesArray) => {
          expect(dbString).toMatchSnapshot();
          expect(valuesArray).toEqual([userId, body.list, indexArray]);
          return Promise.resolve(null);
        });

        const result = await updateSecurities(userId, body);

        expect(result).toEqual(null);
        expect(global.pool.query).toHaveBeenCalledTimes(5);
      });
    });
  });
});
