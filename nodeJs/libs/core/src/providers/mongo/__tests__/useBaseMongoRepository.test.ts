import { Db, Collection, WithId, IndexDescription } from 'mongodb';
import { useBaseRepository } from '../useBaseMongoRepository';
import { ok, notFoundErr, basicErr } from '../../../utils/result';

interface TestDomain {
  id: string;
  name: string;
}

interface TestDao {
  _id: string;
  name: string;
}

const toDao = (domainEntity: TestDomain): TestDao => ({
  _id: domainEntity.id,
  name: domainEntity.name,
});

const toDomain = (daoEntity: WithId<TestDao>): TestDomain => ({
  id: daoEntity._id,
  name: daoEntity.name,
});

const daoMock = (): TestDao => {
  return { _id: '123', name: 'Test Name' };
};
const domainMock = (): TestDomain => {
  return { id: '123', name: 'Test Name' };
};

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('useBaseRepository', () => {
  let mockDb: jest.Mocked<Db>;
  let mockCollection: jest.Mocked<Collection<TestDao>>;

  beforeEach(() => {
    mockCollection = {
      insertOne: jest.fn(),
      insertMany: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      listIndexes: jest.fn(),
      createIndex: jest.fn().mockResolvedValue('name'),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      replaceOne: jest.fn(),
    } as any;

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
      client: {
        startSession: jest.fn(),
      },
    } as any;
  });

  it('should create an entity successfully when it does not exist', async () => {
    const repository = useBaseRepository<TestDomain, TestDao>(
      mockDb,
      'testCollection',
      toDao,
      toDomain
    );

    mockCollection.findOne.mockResolvedValueOnce(null); 
    mockCollection.insertOne.mockResolvedValueOnce({
      acknowledged: true,
      insertedId: '123'
    } as any);

    const result = await repository.create(domainMock());

    expect(result).toEqual(ok(domainMock(), ['Entity created successfully']));
    expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
    expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: '123' });
    expect(mockCollection.insertOne).toHaveBeenCalledWith(daoMock());
  });

  it('should update an entity when it already exists', async () => {
    const repository = useBaseRepository<TestDomain, TestDao>(
      mockDb,
      'testCollection',
      toDao,
      toDomain
    );

    mockCollection.findOne.mockResolvedValueOnce(daoMock()); // Entity exists
    mockCollection.replaceOne.mockResolvedValueOnce({
      acknowledged: true,
      modifiedCount: 1,
      upsertedId: null,
      upsertedCount: 0,
      matchedCount: 1
    } as any);

    const result = await repository.create(domainMock());

    expect(result).toEqual(
      ok(domainMock(), ['Entity updated successfully (replaced existing)'])
    );
    expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
    expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: '123' });
    expect(mockCollection.replaceOne).toHaveBeenCalledWith(
      { _id: '123' },
      daoMock()
    );
  });

  it('should return all entities successfully', async () => {
    const repository = useBaseRepository<TestDomain, TestDao>(
      mockDb,
      'testCollection',
      toDao,
      toDomain
    );

    const daoEntities: WithId<TestDao>[] = [
      { _id: '123', name: 'Test Name' },
      { _id: '456', name: 'Another Name' },
    ];
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValueOnce(daoEntities),
    } as any);

    const result = await repository.getAll();

    expect(result).toEqual(
      ok([
        { id: '123', name: 'Test Name' },
        { id: '456', name: 'Another Name' },
      ])
    );
    expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
    expect(mockCollection.find).toHaveBeenCalled();
  });

  it('should return an empty array if no entities are found', async () => {
    const repository = useBaseRepository<TestDomain, TestDao>(
      mockDb,
      'testCollection',
      toDao,
      toDomain
    );

    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValueOnce([]),
    } as any);

    const result = await repository.getAll();

    expect(result).toEqual(ok([]));
    expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
    expect(mockCollection.find).toHaveBeenCalled();
  });

  describe('getById', () => {
    it('should return success', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      mockCollection.findOne.mockResolvedValue(daoMock());

      const result = await repository.getById('id');

      expect(result).toEqual(ok(domainMock()));
    });
    it('should return notFoundErr if no entity is found', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.getById('id');

      expect(result).toEqual(notFoundErr('Document with id id not found'));
    });

    describe('getByIds', () => {
      it('should return success', async () => {
        const repository = useBaseRepository<TestDomain, TestDao>(
          mockDb,
          'testCollection',
          toDao,
          toDomain
        );

        const daoEntities: WithId<TestDao>[] = [
          { _id: '123', name: 'Test Name' },
          { _id: '456', name: 'Another Name' },
        ];
        mockCollection.find.mockReturnValue({
          toArray: jest.fn().mockResolvedValueOnce(daoEntities),
        } as any);
        const result = await repository.getByIds(['id']);

        expect(result).toEqual(
          ok([
            { id: '123', name: 'Test Name' },
            { id: '456', name: 'Another Name' },
          ])
        );
        expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
        expect(mockCollection.find).toHaveBeenCalled();
      });
    });
  });

  describe('createIndex', () => {
    it('should create index successfully', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      const indexes: IndexDescription[] = [];

      mockCollection.listIndexes.mockReturnValue({
        toArray: jest.fn().mockResolvedValueOnce(indexes),
      } as any);

      const result = await repository.createIndex('name');

      expect(result).toEqual(ok('Index created successfully on field: name'));
      expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
      expect(mockCollection.listIndexes).toHaveBeenCalled();
      expect(mockCollection.createIndex).toHaveBeenCalled();
    });

    it('should return ok when Index already exists', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      const indexes: IndexDescription[] = [
        {
          name: 'name',
          key: {},
        },
      ];

      mockCollection.listIndexes.mockReturnValue({
        toArray: jest.fn().mockResolvedValueOnce(indexes),
      } as any);

      const result = await repository.createIndex('name');

      expect(result).toEqual(ok('Index already exists'));
    });
  });

  describe('update', () => {
    it('should update entity successfully', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      const updatedDao = { _id: '123', name: 'Updated Name' };
      mockCollection.findOneAndUpdate.mockResolvedValueOnce(updatedDao);

      const result = await repository.update('123', { name: 'Updated Name' });

      expect(result).toEqual(
        ok({ id: '123', name: 'Updated Name' }, ['Entity updated successfully'])
      );
      expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '123' },
        { $set: { name: 'Updated Name' } },
        { returnDocument: 'after' }
      );
    });

    it('should return notFoundErr if entity does not exist', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      mockCollection.findOneAndUpdate.mockResolvedValueOnce(null);

      const result = await repository.update('123', { name: 'Updated Name' });

      expect(result).toEqual(notFoundErr('Document with id 123 not found'));
      expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '123' },
        { $set: { name: 'Updated Name' } },
        { returnDocument: 'after' }
      );
    });
  });

  it('should create many entities successfully when they do not exist', async () => {
    const repository = useBaseRepository<TestDomain, TestDao>(
      mockDb,
      'testCollection',
      toDao,
      toDomain
    );

    const entities = [
      { id: '123', name: 'Test Name' },
      { id: '456', name: 'Another Name' },
    ];

    // Mock that no entities exist (empty array from find().toArray())
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValueOnce([]),
    } as any);

    // Mock insertMany for batch insert
    mockCollection.insertMany = jest.fn().mockResolvedValueOnce(undefined);

    const result = await repository.createMany(entities);

    expect(result).toEqual(
      ok(entities, ['Entity 123 will be created', 'Entity 456 will be created'])
    );
    expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
    expect(mockCollection.find).toHaveBeenCalledWith({
      _id: { $in: ['123', '456'] },
    });
    expect(mockCollection.insertMany).toHaveBeenCalledTimes(1);
  });

  it('should update many entities when they already exist', async () => {
    const repository = useBaseRepository<TestDomain, TestDao>(
      mockDb,
      'testCollection',
      toDao,
      toDomain
    );

    const entities = [
      { id: '123', name: 'Test Name' },
      { id: '456', name: 'Another Name' },
    ];

    // Mock that entities exist (returned from find().toArray())
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValueOnce([
        { _id: '123', name: 'Old Name' },
        { _id: '456', name: 'Old Name' },
      ]),
    } as any);

    // Mock replaceOne for updates
    mockCollection.replaceOne = jest
      .fn()
      .mockResolvedValueOnce(undefined) // First replace
      .mockResolvedValueOnce(undefined); // Second replace

    const result = await repository.createMany(entities);

    expect(result).toEqual(
      ok(entities, ['Entity 123 will be updated', 'Entity 456 will be updated'])
    );
    expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
    expect(mockCollection.find).toHaveBeenCalledWith({
      _id: { $in: ['123', '456'] },
    });
    expect(mockCollection.replaceOne).toHaveBeenCalledTimes(2);
  });

  it('should handle mixed create and update for many entities', async () => {
    const repository = useBaseRepository<TestDomain, TestDao>(
      mockDb,
      'testCollection',
      toDao,
      toDomain
    );

    const entities = [
      { id: '123', name: 'Test Name' },
      { id: '456', name: 'Another Name' },
    ];

    // Mock: only second entity exists (returned from find().toArray())
    mockCollection.find.mockReturnValue({
      toArray: jest
        .fn()
        .mockResolvedValueOnce([{ _id: '456', name: 'Old Name' }]),
    } as any);

    // Mock insertMany for new entities
    mockCollection.insertMany = jest.fn().mockResolvedValueOnce(undefined);
    // Mock replaceOne for existing entities
    mockCollection.replaceOne = jest.fn().mockResolvedValueOnce(undefined);

    const result = await repository.createMany(entities);

    expect(result).toEqual(
      ok(entities, ['Entity 123 will be created', 'Entity 456 will be updated'])
    );
    expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
    expect(mockCollection.find).toHaveBeenCalledWith({
      _id: { $in: ['123', '456'] },
    });
    expect(mockCollection.insertMany).toHaveBeenCalledTimes(1);
    expect(mockCollection.replaceOne).toHaveBeenCalledTimes(1);
  });

  it('should handle error during create operation', async () => {
    const repository = useBaseRepository<TestDomain, TestDao>(
      mockDb,
      'testCollection',
      toDao,
      toDomain
    );

    mockCollection.findOne.mockResolvedValueOnce(null); // Entity doesn't exist
    mockCollection.insertOne.mockRejectedValueOnce(new Error('Database error'));

    const result = await repository.create(domainMock());

    expect(result).toEqual(
      notFoundErr('Failed to create/update entity: Database error')
    );
  });

  it('should handle error during createMany operation', async () => {
    const repository = useBaseRepository<TestDomain, TestDao>(
      mockDb,
      'testCollection',
      toDao,
      toDomain
    );

    const entities = [{ id: '123', name: 'Test Name' }];

    // Mock find() to throw error
    mockCollection.find.mockReturnValue({
      toArray: jest
        .fn()
        .mockRejectedValueOnce(new Error('Database connection error')),
    } as any);

    const result = await repository.createMany(entities);

    expect(result).toEqual(
      basicErr('Failed to create/update entities: Database connection error')
    );
  });

  describe('delete', () => {
    it('should delete entity successfully', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      mockCollection.deleteOne.mockResolvedValueOnce({
        deletedCount: 1,
        acknowledged: true,
      });

      const result = await repository.delete('123');

      expect(result).toEqual(ok(undefined, ['Entity deleted successfully']));
      expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: '123' });
    });

    it('should return notFoundErr if entity does not exist', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      mockCollection.deleteOne.mockResolvedValueOnce({
        deletedCount: 0,
        acknowledged: true,
      });

      const result = await repository.delete('123');

      expect(result).toEqual(notFoundErr('Document with id 123 not found'));
      expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: '123' });
    });

    it('should delete many entities successfully', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      mockCollection.deleteMany = jest.fn().mockResolvedValueOnce({
        deletedCount: 2,
        acknowledged: true,
      });

      const filter = { name: 'Test Name' };
      const result = await repository.deleteMany(filter);

      expect(result).toEqual(ok(undefined, ['2 entities deleted']));
      expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
      expect(mockCollection.deleteMany).toHaveBeenCalledWith(filter);
    });

    it('should return notFoundErr if no entities are found for deletion', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      mockCollection.deleteMany = jest.fn().mockResolvedValueOnce({
        deletedCount: 0,
        acknowledged: true,
      });

      const filter = { name: 'NonExistent' };
      const result = await repository.deleteMany(filter);

      expect(result).toEqual(
        notFoundErr('No documents matching the filter criteria found')
      );
      expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
      expect(mockCollection.deleteMany).toHaveBeenCalledWith(filter);
    });

    it('should handle complex filter correctly', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      mockCollection.deleteMany = jest.fn().mockResolvedValueOnce({
        deletedCount: 1,
        acknowledged: true,
      });

      const filter = { _id: { $in: ['123', '456'] } };
      const result = await repository.deleteMany(filter);

      expect(result).toEqual(ok(undefined, ['1 entities deleted']));
      expect(mockDb.collection).toHaveBeenCalledWith('testCollection');
      expect(mockCollection.deleteMany).toHaveBeenCalledWith(filter);
    });
  });

  describe('executeTransaction', () => {
    it('should execute transaction successfully', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      const mockSession = {
        withTransaction: jest.fn().mockImplementation(async (callback) => {
          await callback(mockSession);
        }),
        endSession: jest.fn(),
      };

      (mockDb as any).client = {
        startSession: jest.fn().mockReturnValue(mockSession),
      };

      const operation = jest.fn().mockResolvedValue('transaction result');

      const result = await repository.executeTransaction(operation);

      expect(result).toEqual(ok('transaction result'));
      expect((mockDb as any).client.startSession).toHaveBeenCalled();
      expect(mockSession.withTransaction).toHaveBeenCalled();
      expect(operation).toHaveBeenCalledWith(mockSession);
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should handle transaction failure', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      const mockSession = {
        withTransaction: jest
          .fn()
          .mockRejectedValue(new Error('Transaction failed')),
        endSession: jest.fn(),
      };

      (mockDb as any).client = {
        startSession: jest.fn().mockReturnValue(mockSession),
      };

      const operation = jest.fn().mockResolvedValue('transaction result');

      const result = await repository.executeTransaction(operation);

      expect(result).toEqual(
        notFoundErr('Transaction failed: Error: Transaction failed')
      );
      expect((mockDb as any).client.startSession).toHaveBeenCalled();
      expect(mockSession.withTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should handle operation failure within transaction', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      const mockSession = {
        withTransaction: jest.fn().mockImplementation(async (callback) => {
          await callback(mockSession);
        }),
        endSession: jest.fn(),
      };

      (mockDb as any).client = {
        startSession: jest.fn().mockReturnValue(mockSession),
      };

      const operation = jest
        .fn()
        .mockRejectedValue(new Error('Operation failed'));

      const result = await repository.executeTransaction(operation);

      expect(result).toEqual(
        notFoundErr('Transaction failed: Error: Operation failed')
      );
      expect((mockDb as any).client.startSession).toHaveBeenCalled();
      expect(mockSession.withTransaction).toHaveBeenCalled();
      expect(operation).toHaveBeenCalledWith(mockSession);
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should ensure session is ended even if transaction fails', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      const mockSession = {
        withTransaction: jest
          .fn()
          .mockRejectedValue(new Error('Transaction failed')),
        endSession: jest.fn(),
      };

      (mockDb as any).client = {
        startSession: jest.fn().mockReturnValue(mockSession),
      };

      const operation = jest.fn().mockResolvedValue('transaction result');

      await repository.executeTransaction(operation);

      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should pass session to operation callback', async () => {
      const repository = useBaseRepository<TestDomain, TestDao>(
        mockDb,
        'testCollection',
        toDao,
        toDomain
      );

      const mockSession = {
        withTransaction: jest.fn().mockImplementation(async (callback) => {
          await callback(mockSession);
        }),
        endSession: jest.fn(),
      };

      (mockDb as any).client = {
        startSession: jest.fn().mockReturnValue(mockSession),
      };

      const operation = jest.fn().mockResolvedValue('test result');

      await repository.executeTransaction(operation);

      expect(operation).toHaveBeenCalledWith(mockSession);
    });
  });
});
