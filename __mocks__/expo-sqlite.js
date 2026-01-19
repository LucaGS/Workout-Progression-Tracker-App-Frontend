const mockDb = {
  execAsync: jest.fn(async () => {}),
  runAsync: jest.fn(async () => {}),
  getAllAsync: jest.fn(async () => []),
  getFirstAsync: jest.fn(async () => null),
};

module.exports = {
  openDatabaseAsync: jest.fn(async () => mockDb),
  __mockDb: mockDb,
};
