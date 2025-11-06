import * as path from 'path';
import { loadBusProto } from '../protoLoader';
import * as protoLoader from '@grpc/proto-loader';
import * as grpc from '@grpc/grpc-js';

jest.mock('@grpc/proto-loader', () => ({
  loadSync: jest.fn(),
}));

jest.mock('@grpc/grpc-js', () => ({
  loadPackageDefinition: jest.fn(),
}));

const loadSyncMock =
  protoLoader.loadSync as jest.MockedFunction<typeof protoLoader.loadSync>;
const loadPackageDefinitionMock =
  grpc.loadPackageDefinition as jest.MockedFunction<
    typeof grpc.loadPackageDefinition
  >;

describe('loadBusProto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads command bus proto definition with expected options', () => {
    const pkgDefinition = { services: {} };
    const compiledPackage = { bus: { v1: {} } };

    loadSyncMock.mockReturnValue(pkgDefinition as never);
    loadPackageDefinitionMock.mockReturnValue(compiledPackage as never);

    const result = loadBusProto();

    const expectedPath = path.resolve(
      __dirname,
      '../proto/bus/v1/command_bus.proto',
    );

    expect(loadSyncMock).toHaveBeenCalledTimes(1);
    const [protoPath, options] = loadSyncMock.mock.calls[0];

    expect(protoPath).toBe(expectedPath);
    expect(options).toMatchObject({
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    expect(loadPackageDefinitionMock).toHaveBeenCalledWith(pkgDefinition);
    expect(result).toBe(compiledPackage);
  });
});
