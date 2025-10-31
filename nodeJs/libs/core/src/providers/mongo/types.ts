export interface MongoConfig {
  uri: string;
}

export const MONGO_TOKENS = {
  MONGODB_KEY: Symbol.for('MongoDB'),
  MONGOCONNECTION_KEY: Symbol.for('MongoConnection'),
  MONGOCONFIG_KEY: Symbol.for('MongoConfig'),
} as const;
