const { errorResponse } = require('../errorResponse');

global.console.log = jest.fn();

const stringError = 'not an object';
const noCodeError = {
  message: 'testMessage',
};
const codeError = {
  code: 'testCode',
  message: 'testMessage',
};

const res = {
  status: 400,
  body: {
    error: codeError,
  },
};
const expectedResult = `[400] ${JSON.stringify(res)}`;

describe('functions', () => {
  describe('errorResponse', () => {
    afterEach(() => {
      global.console.log.mockReset();
    });

    it('returns callback error, when provided a string error', async () => {
      const result = errorResponse(stringError);

      expect(result).toMatchSnapshot();
      expect(global.console.log).toMatchSnapshot();
    });

    it("returns an unexpected error, when provided an object error without a 'code' key", async () => {
      const result = errorResponse(noCodeError);

      expect(result).toMatchSnapshot();
      expect(global.console.log).toMatchSnapshot();
    });

    it("returns callback error, when provided an object error with a 'code' key", async () => {
      const result = errorResponse(codeError);

      expect(result).toEqual(expectedResult);
      expect(global.console.log).toMatchSnapshot();
    });
  });
});
