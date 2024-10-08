import cors from "cors"
import cookieParser from "cookie-parser"
import express from "express"

const app = express()

//cors options
const corsOptions = {
    origin: [,
       'http://localhost:5173',
       'https://localhost:5173',
       'https://alphaware-task-frontend.vercel.app',
       'https://alphaware-task-frontend.vercel.app/*',
       "https://awesome-jobs-gilt.vercel.app/",
       "https://awesome-jobs-gilt.vercel.app/*"
     ],
     methods: ["POST", "GET", "PUT", "DELETE"],
     credentials: true, // Allow cookies across domains if needed (for authentication)
};

//middlewares
app.use(cors(corsOptions));
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("tmp"))
app.use(cookieParser())


//routes import
import userRouter from "./routes/user.routes.js"
import jobRouter from "./routes/job.routes.js"
app.use("/api/v1/user", userRouter)
app.use("/api/v1/jobs", jobRouter)

export default app
