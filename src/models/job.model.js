import mongoose, {Schema} from "mongoose";
// Define the schema for the Job model
const jobSchema = new Schema(
    {
        companyName:{
            type: String,
            required: true
        },
        position:{
            type: String,
            required: true
        },
        contract:{
            type: String,
            required: true,
            enum: ["Full Time", "Part Time"]
        },
        location:{
            type: String,
            required: true
        },
        postedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        applications: [
            {
                applicantId:{
                    type:  Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                applicantName:{
                    type: String,
                    required: true,
                },
                email:{
                    type: String,
                    required: true,
                },
                phone:{
                    type: Number,
                    required: true,
                },
                resumeURL:{
                    type:String,
                    trim: true,
                    default: "https://morth.nic.in/sites/default/files/dd12-13_0.pdf"
                },
                dateApplied: {
                    type: Date,
                    default: Date.now,
                },
            },
        ]
    },
    {timestamps: true}
)
export const Job = mongoose.model("Job",  jobSchema)