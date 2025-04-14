import { MongoClient } from "mongodb";

let client: MongoClient;

export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig();

  // Create MongoDB client
  client = new MongoClient(config.mongodbUri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    // Test the connection
    await client.db().command({ ping: 1 });
    console.log("MongoDB connection test successful");

    // Close connection when the app is shutting down
    nitroApp.hooks.hook("close", async () => {
      await client.close();
      console.log("MongoDB connection closed");
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
});
