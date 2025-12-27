import mongoose from "mongoose";

mongoose.set('strictQuery', false);

const connectionToDB = async () => {

    try {
        
        const {connection } = await mongoose.connect(
        process.env.MONGO_URI || `mongodb://localhost:27017/mydatabase`
    );

    if (connection) {
        console.log(`MongoDB connected: ${connection.host}`);
    }
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }

}

export default connectionToDB;