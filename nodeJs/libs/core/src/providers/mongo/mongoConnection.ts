import { inject, injectable } from 'inversify';
import { MongoClient, Db } from 'mongodb';
import {
  Result,
  BasicError,
  ok,
  basicErr,
} from '../../utils/result';
import { MONGO_TOKENS, type MongoConfig } from './types';

@injectable()
export class MongoConnection {
  public client: MongoClient;
  private db: Db | null = null;

  constructor(
    @inject(MONGO_TOKENS.MONGOCONFIG_KEY) private readonly config: MongoConfig,
  ) {
    this.client = new MongoClient(config.uri);
  }

  async connect(onFailure: () => void): Promise<Result<Db, BasicError>> {
    try {
      console.log('Connecting to MongoDB...');
      await this.client.connect();
      this.db = this.client.db();
      console.log('Connected to MongoDB');
      return ok(this.db);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to connect to MongoDB:', errorMessage);
      onFailure();
      return basicErr(`Failed to connect to MongoDB: ${errorMessage}`);
    }
  }

  async close(onFailure: () => void): Promise<Result<void, BasicError>> {
    try {
      if (this.client) {
        await this.client.close();
        this.db = null;
        console.log('MongoDB connection closed');
        return ok(undefined);
      }
      return ok(undefined);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to close MongoDB connection:', errorMessage);
      onFailure();
      return basicErr(`Failed to close MongoDB connection: ${errorMessage}`);
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  isConnected(): boolean {
    return this.db !== null;
  }
}
