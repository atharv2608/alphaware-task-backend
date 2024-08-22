import mongoose from "mongoose";

const connection = async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.DB_URL}`)
        console.log("Database connected");
        console.log("DB Host: ", connectionInstance.connection.host)
    } catch (error) {
        console.error("MONGODB FAILED TO CONNECT!");
        process.exit(1)
    }
}

export default connection;