import mongoose from "mongoose";

export class MongoDBClient {
  static async connect() {
    try {
      const conn = await mongoose.connect(
        `${process.env.MONGODB_URI}/${process.env.MONGODB_DB_NAME}?authSource=admin`,
      );
      console.log(`MongoDB conectado: ${conn.connection.host}`);
    } catch (error) {
      console.error(`Error conectando a MongoDB: ${error.message}`);
      process.exit(1);
    }
  }
}