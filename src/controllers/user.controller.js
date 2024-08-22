import asyncHandler from "./../utils/asyncHandler.js"
import apiError from "./../utils/apiError.js"
import  { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js";
import { encryptToken } from "../utils/tokenEncryption.js";

const createUser = asyncHandler(async (req, res)=>{
    try {
        const {firstName, lastName, email, phone, password} = req.body;
        if([firstName, lastName, email, phone, password].some(field => field?.trim() === "" )){
            return apiError(res, 400, "All fields are required")
        }
        const existingUser = await User.findOne({
            $or: [{email}, {phone}]
        })

        if(existingUser){
            return apiError(res, 409, "User already exists")
        }
        const role = email.includes("@alphaware.com") ? "admin" : "user"
        

        const user = await User.create({
            firstName,
            lastName,
            email,
            phone,
            role,
            password
        })

        const createdUser = await User.findById(user?._id).select("-password")
        if(!createUser) return apiError(res, 500, "Registration Failed");

        return res
        .status(200)
        .json(
            new ApiResponse(200, createUser, "User created")
        )
    } catch (error) {
        console.error("Error registering user: ", error)
        return apiError(res, 500, "Registration Failed");

    }
})

const loginUser = asyncHandler(async(req, res)=>{
    try {
        const {email, password} = req.body;
    
        if(!email || !password) return apiError(res, 400, "Please fill all details");
    
        const user = await User.findOne({email})
        if(!user) return apiError(res, 404, "User not found");
    
        const isPasswordCorrect = await user.isPasswordCorrect(password)
        
        if(!isPasswordCorrect) return apiError(res, 401, "Invalid credentials");
    
        const accessToken = await user.generateAccessToken(user?._id);
        if(!accessToken) return apiError(res, 500, "Failed to generate access token");
    
        const loggedInUser = await User.findById(user?._id).select("-password")
    
        const encryptedToken = encryptToken(accessToken, process.env.ENCRYPTION_KEY)
        const userData = {
            ...loggedInUser?._doc,
            accessToken: encryptedToken
        }
        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 24 * 60 * 60 * 1000
        }
        return res
        .status(200)
        .cookie("accessToken", encryptedToken, cookieOptions)
        .json(
            new ApiResponse(
                200, userData, "Logged in"
            )
        )
    } catch (error) {
        console.error("Error while logging in: ", error)
        return apiError(res, 500, "Failed to login");
    }
})


export {createUser, loginUser}