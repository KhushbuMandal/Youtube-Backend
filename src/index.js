// require('dotenv').config({path: './env'})

import dotenv from "dotenv"
import { connectDB } from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
})


connectDB()
.then( () => {
    app.listen(process.env.PORT || 5000 , () => {
        console.log(`Server is running at poirt : ${process.env.PORT}`);
    })

})
.catch((err) => {
    console.log ("MONGODB db connection failed !!! " , err);
})































/*
import { DB_NAME } from "./constants";
import express from "express";
const app = express();
( async() => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        application.on("errror" , (error) => {
            console.log("ERRR" , error);
            throw error
        })

        app.listen(process.env.PORT , () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("Error" , error);
        throw err
    }
})()
*/    