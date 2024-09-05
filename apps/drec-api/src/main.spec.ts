import { startAPI } from '.';
import { Logger } from '@nestjs/common';

jest.mock('.', () => ({
  startAPI: jest.fn(),
}));

describe('Main Script', () => {
  let logger: Logger;

  beforeAll(() => {
    // Mock the logger
    logger = new Logger();
    jest.spyOn(logger, 'warn');

    // Mock the process event listeners
    process.setMaxListeners = jest.fn();
    process.on = jest.fn((event, listener) => {
      if (event === 'warning') {
        listener({ stack: 'Mocked warning stack trace' });
      }
      return process; // Return process to satisfy TypeScript
    });
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should set max listeners to 0', () => {
    require('./main'); // Load the script
    expect(process.setMaxListeners).toHaveBeenCalledWith(0);
  });

  it('should call startAPI', () => {
    expect(startAPI).toHaveBeenCalled();
  });
});
