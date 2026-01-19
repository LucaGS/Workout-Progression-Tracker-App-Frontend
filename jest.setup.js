import '@testing-library/jest-native/extend-expect';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

if (!global.fetch) {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({}) }));
}
