import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import generateAccessToken from "./../utils/generateAccessToken.js";

// Define the schema for the User model
const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    phone: {
      type: Number,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      required: true,
      lowercase: true,
      trim: true,
      default: "user",
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    jobsApplied: [
      {
        jobId: {
          type: Schema.Types.ObjectId,
          ref: "Job",
        },
        dateApplied: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Middleware to hash the password before saving the user document
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare the given password with the hashed password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to generate an access token for the user
userSchema.methods.generateAccessToken = generateAccessToken;

export const User = mongoose.model("User", userSchema);
