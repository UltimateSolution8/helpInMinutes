import '@testing-library/jest-native/extend-expect';
import { server } from './src/mocks/server';

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests.
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});

// Clean up after the tests are finished.
afterAll(() => server.close());

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
