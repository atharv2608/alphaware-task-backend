import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import apiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {decryptToken} from "../utils/tokenEncryption.js"
const returnDecodedToken = (req, res, tokenSecret)=>{
    try {
        const enctoken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")    
        if(!enctoken){
            console.error("Token not received from frontend")
            return apiError(res, 401, "Unauthorised Request1")
        } 

        const token = decryptToken(enctoken, process.env.ENCRYPTION_KEY)
        if(!token) {
            console.error("Failed to decrypt token")
            return apiError(res, 401, "Failed to decrypt token")   
        } 

        const decodedToken =  jwt.verify(token, tokenSecret)
        if(!decodedToken){
            console.error("Invalid signed token ",error)
            return apiError(res, 401, "Invalid access token")
        } 
        

        return decodedToken
    } catch (error) {
        console.error("Error in decoding token: ",error)
        return apiError(res, 500, "Invalid access token")

    }
}

const verifyLogin = asyncHandler(async(req, res, next)=>{
    try {
        const decodedToken = returnDecodedToken(req,res , process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password")
        if(!user) return apiError(res, 498, "Invalid access token");
        req.user = user,
        req.isAdmin = user.role === "admin" ? true:false;
        next();
    } catch (error) {
        return apiError(res, 500, "Invalid access token")
    }
})

export {verifyLogin}