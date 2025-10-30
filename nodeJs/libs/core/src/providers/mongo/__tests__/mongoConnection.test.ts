import { MongoConnection } from '../mongoConnection';
import { isOk, isErr } from '../../../utils/result';

// Mock MongoDB
const mockConnect = jest.fn();
const mockClose = jest.fn();
const mockDb = jest.fn().mockReturnValue({
  databaseName: 'amadeo-test',
});

jest.mock('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    close: mockClose,
    db: mockDb,
  })),
}));

describe('MongoConnection', () => {
  let mongoConnection: MongoConnection;

  beforeEach(() => {
    mongoConnection = new MongoConnection(
      'mongodb://localhost:27017/amadeo-test'
    );
  });

  afterEach(async () => {
    if (mongoConnection.isConnected()) {
      await mongoConnection.close(() => {});
    }
    jest.clearAllMocks();
  });

  it('should connect to MongoDB successfully', async () => {
    // Arrange
    mockConnect.mockResolvedValue(undefined);

    // Act
    const result = await mongoConnection.connect(() => {});

    // Assert
    expect(isOk(result)).toBeTruthy();
    if (isOk(result)) {
      expect(result.value).toBeDefined();
      expect(mongoConnection.isConnected()).toBeTruthy();
    }
    expect(mockConnect).toHaveBeenCalled();
  });

  it('should close connection successfully', async () => {
    // Arrange
    mockConnect.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);

    const connectResult = await mongoConnection.connect(() => {});
    expect(isOk(connectResult)).toBeTruthy();

    // Act
    const closeResult = await mongoConnection.close(() => {});

    // Assert
    expect(isOk(closeResult)).toBeTruthy();
    expect(mongoConnection.isConnected()).toBeFalsy();
    expect(mockClose).toHaveBeenCalled();
  });

  it('should throw error when getting db without connection', () => {
    // Act & Assert
    expect(() => mongoConnection.getDb()).toThrow(
      'Database not connected. Call connect() first.'
    );
  });

  it('should return correct database instance when connected', async () => {
    // Arrange
    mockConnect.mockResolvedValue(undefined);

    const connectResult = await mongoConnection.connect(() => {});
    expect(isOk(connectResult)).toBeTruthy();

    // Act
    const db = mongoConnection.getDb();

    // Assert
    expect(db).toBeDefined();
    expect(db.databaseName).toBe('amadeo-test');
  });

  it('should handle connection errors gracefully', async () => {
    // Arrange
    const errorMessage = 'Connection failed';
    mockConnect.mockRejectedValue(new Error(errorMessage));
    const onFailure = jest.fn();

    // Act
    const result = await mongoConnection.connect(onFailure);

    // Assert
    expect(isErr(result)).toBeTruthy();
    if (isErr(result)) {
      expect(result.error.message).toContain('Failed to connect to MongoDB');
      expect(result.error.message).toContain(errorMessage);
    }
    expect(mongoConnection.isConnected()).toBeFalsy();
    expect(onFailure).toHaveBeenCalled();
  });

  it('should handle disconnect errors gracefully', async () => {
    // Arrange
    mockConnect.mockResolvedValue(undefined);
    mockClose.mockRejectedValue(new Error('Disconnect failed'));
    const onFailure = jest.fn();

    const connectResult = await mongoConnection.connect(() => {});
    expect(isOk(connectResult)).toBeTruthy();

    // Act
    const result = await mongoConnection.close(onFailure);

    // Assert
    expect(isErr(result)).toBeTruthy();
    if (isErr(result)) {
      expect(result.error.message).toContain(
        'Failed to close MongoDB connection'
      );
      expect(result.error.message).toContain('Disconnect failed');
    }
    expect(onFailure).toHaveBeenCalled();
  });
});

describe('MongoConnection constructor', () => {
  it('should create connection with default URI', () => {
    // Act
    const connection = new MongoConnection('mongodb://localhost:27017/test');

    // Assert
    expect(connection).toBeInstanceOf(MongoConnection);
  });

  it('should create connection with custom URI', () => {
    // Arrange
    const customUri = 'mongodb://localhost:27017/custom-test';

    // Act
    const connection = new MongoConnection(customUri);

    // Assert
    expect(connection).toBeInstanceOf(MongoConnection);
  });
});
