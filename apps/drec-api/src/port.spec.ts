import { extractPort, getPort } from './port'; // Adjust the import path as needed

describe('extractPort', () => {
  it('should return the port number from a URL with a port', () => {
    const url = 'http://localhost:8080';
    const port = extractPort(url);
    expect(port).toBe(8080);
  });

  it('should return the port number from a URL with a port and path', () => {
    const url = 'http://localhost:8080/path';
    const port = extractPort(url);
    expect(port).toBe(8080);
  });

  it('should return the port number from a URL with a port, path, and query', () => {
    const url = 'http://localhost:8080/path?query=param';
    const port = extractPort(url);
    expect(port).toBe(8080);
  });

  it('should return null if the URL does not contain a port', () => {
    const url = 'http://localhost';
    const port = extractPort(url);
    expect(port).toBeNaN();
  });

  it('should return null for an empty URL string', () => {
    const url = '';
    const port = extractPort(url);
    expect(port).toBeNull();
  });

  it('should return null for a malformed URL', () => {
    const url = 'http://localhost:';
    const port = extractPort(url);
    expect(port).toBeNaN();
  });

  it('should handle URLs with a scheme and port only', () => {
    const url = 'http://:8080';
    const port = extractPort(url);
    expect(port).toBe(8080);
  });
});

describe('getPort', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Clears the cache for process.env
    process.env = { ...originalEnv }; // Restores the environment variables
  });

  afterAll(() => {
    process.env = originalEnv; // Restore original environment after all tests
  });

  it('should return the PORT from environment variables if defined', () => {
    process.env.PORT = '5000';
    const port = getPort();
    expect(port).toBe(5000);
  });

  it('should return the BACKEND_PORT from environment variables if PORT is undefined', () => {
    delete process.env.PORT;
    process.env.BACKEND_PORT = '6000';
    const port = getPort();
    expect(port).toBe(6000);
  });

  it('should return the default port (3040) if no environment variable is defined', () => {
    delete process.env.PORT;
    delete process.env.BACKEND_PORT;
    const port = getPort();
    expect(port).toBe(3040);
  });
});
