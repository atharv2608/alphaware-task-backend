import connection from "./database/connectDatabase.js";
import dotenv from "dotenv"
import app from "./app.js";

dotenv.config({
    path: "./.env"
})

connection()
.then(()=>{
    app.get("/", (req, res)=>{
        res.send("<h1>Jobs Api</h1>")
    })

    app.listen(process.env.PORT || 3000, ()=>{
        console.log("App is running on port: ", process.env.PORT);
    })
})
.catch((error)=>{
    console.log('MONGODB FAILED TO CONNECT: ', error);
})