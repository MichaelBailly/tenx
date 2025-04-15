import { MongoClient } from "mongodb";
import { dbLogger } from "../utils/logger";

let client: MongoClient;

export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig();

  // Create MongoDB client with full options from config
  client = new MongoClient(config.mongodbUri, config.mongodbOptions);

  try {
    // Connect to MongoDB
    await client.connect();
    dbLogger.info("Connected to MongoDB");

    // Test the connection
    await client.db().command({ ping: 1 });
    dbLogger.info("MongoDB connection test successful");

    // Close connection when the app is shutting down
    nitroApp.hooks.hook("close", async () => {
      await client.close();
      dbLogger.info("MongoDB connection closed");
    });
  } catch (error) {
    dbLogger.error({ err: error }, "MongoDB connection error");
    throw error;
  }
});
