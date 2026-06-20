import mongoose from "mongoose";
import logger from "./logger.js";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        logger.info("MongoDB connected");
    } catch (error) {
        logger.fatal({ err: error }, "MongoDB connection error");
        process.exit(1);
    }
};

export default connectDB;