import asyncHandler from "./../utils/asyncHandler.js";
import apiError from "./../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { encryptToken } from "../utils/tokenEncryption.js";

// Controller to handle user registration
const createUser = asyncHandler(async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Validate that all fields are provided
    if ([firstName, lastName, email, phone, password].some(field => field?.trim() === "")) {
      return apiError(res, 400, "All fields are required");
    }

    // Check if the user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return apiError(res, 409, "User already exists");
    }

    // Determine user role based on email domain
    const role = email.includes("@alphaware.com") ? "admin" : "user";

    // Create a new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      role,
      password
    });

    // Fetch the newly created user without password field
    const createdUser = await User.findById(user?._id).select("-password");
    if (!createdUser) return apiError(res, 500, "Registration Failed");

    // Return success response with created user data
    return res
      .status(200)
      .json(
        new ApiResponse(200, createdUser, "User created")
      );
  } catch (error) {
    console.error("Error registering user: ", error);
    return apiError(res, 500, "Registration Failed");
  }
});

// Controller to handle user login
const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate that email and password are provided
    if (!email || !password) return apiError(res, 400, "Please fill all details");

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return apiError(res, 404, "User not found");

    // Check if the provided password is correct
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) return apiError(res, 401, "Invalid credentials");

    // Generate an access token for the user
    const accessToken = await user.generateAccessToken(user?._id);
    if (!accessToken) return apiError(res, 500, "Failed to generate access token");

    // Fetch the logged-in user without password field
    const loggedInUser = await User.findById(user?._id).select("-password");

    // Encrypt the access token
    const encryptedToken = encryptToken(accessToken, process.env.ENCRYPTION_KEY);

    // Prepare user data to include encrypted token
    const userData = {
      ...loggedInUser?._doc,
      accessToken: encryptedToken
    };

    // Define cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    };

    // Return success response with encrypted token in cookie
    return res
      .status(200)
      .cookie("accessToken", encryptedToken, cookieOptions)
      .json(
        new ApiResponse(
          200, userData, "Logged in"
        )
      );
  } catch (error) {
    console.error("Error while logging in: ", error);
    return apiError(res, 500, "Failed to login");
  }
});

export { createUser, loginUser };
