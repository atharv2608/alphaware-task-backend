//middleware to verify login

import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import apiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { decryptToken } from "../utils/tokenEncryption.js";

// Function to decode and verify the JWT from the request
const returnDecodedToken = (req, res, tokenSecret) => {
    try {
        // Retrieve the encrypted token from cookies or Authorization header
        const enctoken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        // Check if the token is provided
        if (!enctoken) {
            console.error("Token not received from frontend");
            return apiError(res, 401, "Unauthorized Request1"); // Respond with error if token is missing
        }

        // Decrypt the token using the encryption key
        const token = decryptToken(enctoken, process.env.ENCRYPTION_KEY);
        
        // Check if decryption was successful
        if (!token) {
            console.error("Failed to decrypt token");
            return apiError(res, 401, "Failed to decrypt token"); // Respond with error if decryption fails
        }

        // Verify the decrypted token using the provided secret key
        const decodedToken = jwt.verify(token, tokenSecret);
        
        // Check if the token is valid
        if (!decodedToken) {
            console.error("Invalid signed token");
            return apiError(res, 401, "Invalid access token"); // Respond with error if token is invalid
        }

        return decodedToken; // Return the decoded token if everything is successful
    } catch (error) {
        console.error("Error in decoding token: ", error);
        return apiError(res, 500, "Invalid access token"); // Respond with error if an exception occurs
    }
}

// Middleware to verify user login and attach user data to the request object
const verifyLogin = asyncHandler(async (req, res, next) => {
    try {
        // Decode and verify the token from the request
        const decodedToken = returnDecodedToken(req, res, process.env.ACCESS_TOKEN_SECRET);

        // Find the user associated with the decoded token's user ID
        const user = await User.findById(decodedToken?._id).select("-password");

        // Check if the user exists
        if (!user) {
            return apiError(res, 498, "Invalid access token"); // Respond with error if user is not found
        }

        // Attach the user data and admin status to the request object
        req.user = user;
        req.isAdmin = user.role === "admin" ? true : false;

        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        return apiError(res, 500, "Invalid access token"); // Respond with error if an exception occurs
    }
});

export { verifyLogin };
