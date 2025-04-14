import type { Collection, Document } from "mongodb";
import { MongoClient } from "mongodb";
import type { MongoUser } from "~/types/mongo";
import { Config } from "./config";

/**
 * Database service to handle MongoDB connections and common operations
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private client: MongoClient;
  private uri: string;
  private dbName: string;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.uri = Config.mongodb.uri;
    this.dbName = Config.mongodb.database;
    this.client = new MongoClient(this.uri);
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Connect to MongoDB
   */
  public async connect(): Promise<MongoClient> {
    try {
      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }

  /**
   * Get a collection with proper typing
   */
  public getCollection<T extends Document>(
    collectionName: string
  ): Collection<T> {
    return this.client.db(this.dbName).collection<T>(collectionName);
  }

  /**
   * Close the connection
   */
  public async close(): Promise<void> {
    try {
      await this.client.close();
    } catch (error) {
      console.error("MongoDB close connection error:", error);
    }
  }

  /**
   * Run operations with automatic connection management
   * @param operation Function that performs database operations
   * @returns Result of the operation
   */
  public async withConnection<T>(operation: () => Promise<T>): Promise<T> {
    let connected = false;
    try {
      await this.connect();
      connected = true;
      return await operation();
    } finally {
      if (connected) {
        await this.close();
      }
    }
  }

  // ========= USER OPERATIONS =========

  /**
   * Find a user by session ID
   */
  public async findUserBySession(sessionId: string): Promise<MongoUser | null> {
    return this.withConnection(async () => {
      const users = this.getCollection<MongoUser>("users");
      return users.findOne(
        { "sessions._id": sessionId },
        { projection: { "sessions.$": 1, _id: 1, login: 1 } }
      );
    });
  }

  /**
   * Find a user by credentials
   */
  public async findUserByCredentials(
    login: string,
    hashedPassword: string
  ): Promise<MongoUser | null> {
    return this.withConnection(async () => {
      const users = this.getCollection<MongoUser>("users");
      return users.findOne({
        login,
        password: hashedPassword,
      });
    });
  }

  /**
   * Add a session to a user
   */
  public async addUserSession(
    userId: string,
    session: {
      _id: string;
      ts_creation: number;
      ts_last_usage: number;
      lang: string;
    }
  ): Promise<void> {
    return this.withConnection(async () => {
      const users = this.getCollection<MongoUser>("users");
      await users.updateOne({ _id: userId }, { $push: { sessions: session } });
    });
  }

  /**
   * Update a session's last usage timestamp
   */
  public async updateSessionTimestamp(
    sessionId: string,
    userId: string
  ): Promise<void> {
    return this.withConnection(async () => {
      const users = this.getCollection<MongoUser>("users");
      const now = Date.now();
      await users.updateOne(
        { _id: userId, "sessions._id": sessionId },
        { $set: { "sessions.$.ts_last_usage": now } }
      );
    });
  }

  /**
   * Remove a session from a user
   */
  public async removeSession(sessionId: string): Promise<void> {
    return this.withConnection(async () => {
      const users = this.getCollection<MongoUser>("users");
      await users.updateOne(
        { "sessions._id": sessionId },
        { $pull: { sessions: { _id: sessionId } } }
      );
    });
  }
}
