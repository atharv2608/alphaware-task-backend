import connection from "./database/connectDatabase.js";
import dotenv from "dotenv";
import app from "./app.js";

// Load environment variables from the .env file
dotenv.config({
    path: "./.env"
});

// Define a simple route for the root path
app.get("/", (req, res) => {
    res.send("<h1>Jobs Api</h1>");
});

// Establish a connection to the database
connection()
    .then(() => {
        // Start the server once the database connection is successful
        app.listen(process.env.PORT || 3000, () => {
            console.log("App is running on port: ", process.env.PORT || 3000);
        });
    })
    .catch((error) => {
        // Log an error message if the database connection fails
        console.log('MONGODB FAILED TO CONNECT: ', error);
    });
