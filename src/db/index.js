import mongoose, { connect } from "mongoose";
import { DB_NAME } from "../constants.js";


export const connectDB = async () => {

    try {

        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log (`\n MongoDB connected !!! DB Host ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log ("MONGODB connection error" , error);
        process.exit(1)
    }

}