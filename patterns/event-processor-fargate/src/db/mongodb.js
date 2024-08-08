import { MongoClient } from 'mongodb'
import { MONGO_URI } from '../config/envs'

export const client = new MongoClient(MONGO_URI, {
  ignoreUndefined: true,
  maxPoolSize: 10,
  monitorCommands: true,
});