import { startAPI } from '.';

jest.mock('.', () => ({
  startAPI: jest.fn(),
}));

jest.mock('./logger', () => ({
  createNestWinstonLogger: jest.fn(() => ({
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('Main Script', () => {
  beforeAll(() => {
    process.setMaxListeners = jest.fn();
    process.on = jest.fn().mockReturnValue(process);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should set max listeners to 0', () => {
    require('./main');
    expect(process.setMaxListeners).toHaveBeenCalledWith(0);
  });

  it('should call startAPI', () => {
    expect(startAPI).toHaveBeenCalled();
  });
});
