import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Job } from "../models/job.model.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";

// Controller to handle posting a new job
const postJob = asyncHandler(async (req, res) => {
  try {
    // Check if the user is an admin
    if (!req.isAdmin) return apiError(res, 401, "Unauthorised Access");
    const adminId = req?.user?._id;
    const { companyName, position, contract, location } = req.body;

    // Validate that all fields are provided
    if (
      [companyName, position, contract, location].some(
        (field) => field?.trim() === ""
      )
    )
      return apiError(res, 400, "All fields are required");

    // Create a new job entry
    const job = await Job.create({
      companyName,
      position,
      contract,
      location,
      postedBy: adminId,
    });

    // Fetch the newly created job
    const createdJob = await Job.findById(job._id);
    if (!createdJob) return apiError(res, 500, "Failed to post job");

    // Return success response
    return res.status(201).json(new ApiResponse(201, createdJob, "Job Posted"));
  } catch (error) {
    console.error("Error while posting job: ", error);
    return apiError(res, 500, "Failed to post job");
  }
});

// Controller to handle editing an existing job
const editJob = asyncHandler(async (req, res) => {
  try {
    // Check if the user is an admin
    if (!req.isAdmin) return apiError(res, 401, "Unauthorised Access");
    const adminId = req?.user?._id;

    const { jobId, companyName, position, contract, location } = req.body;

    // Validate that all fields are provided
    if (
      [jobId, companyName, position, contract, location].some(
        (field) => field?.trim() === ""
      )
    )
      return apiError(res, 400, "All fields are required");

    // Convert jobId to ObjectId
    const _id = new mongoose.Types.ObjectId(jobId);

    // Find the job by ID
    const findJob = await Job.findById(_id);
    if (!findJob) return apiError(res, 404, "Job not found");

    // Check if the current admin is the one who posted the job
    const postedBy = findJob.postedBy;
    if (adminId.toString() !== postedBy.toString())
      return apiError(res, 403, "Don't have access to edit this job");

    // Update the job with new details
    const updatedJob = await Job.findByIdAndUpdate(
      _id,
      {
        companyName,
        position,
        contract,
        location,
      },
      { new: true }
    );
    if (!updatedJob) return apiError(res, 500, "Failed to update job");

    // Return success response
    return res
      .status(200)
      .json(new ApiResponse(200, updatedJob, "Job updated"));
  } catch (error) {
    console.error("Failed to update job: ", error);
    return apiError(res, 500, "Failed to update job");
  }
});

// Controller to handle deleting a job
const deleteJob = asyncHandler(async (req, res) => {
  try {
    // Check if the user is an admin
    if (!req.isAdmin) return apiError(res, 401, "Unauthorised Access");
    const adminId = req?.user?._id;

    const { _id } = req.body;

    // Find the job by ID
    const job = await Job.findById(_id);
    if (!job) return apiError(res, 404, "Job not found");

    // Check if the current admin is the one who posted the job
    const postedBy = job.postedBy;
    if (adminId.toString() !== postedBy.toString())
      return apiError(res, 403, "Don't have access to delete this job");

    // Delete the job
    const deleteJob = await Job.findByIdAndDelete(_id);
    if (!deleteJob) return apiError(res, 404, "Job not found");

    // Return success response
    return res.status(200).json(new ApiResponse(200, {}, "Job deleted"));
  } catch (error) {
    console.error("Failed to delete job: ", error);
    return apiError(res, 500, "Failed to delete job");
  }
});

// Controller to handle job application
const applyJob = asyncHandler(async (req, res) => {
  try {
    // Check if the user is an admin
    if (req.isAdmin) return apiError(res, 401, "Admin account cannot apply");
    const user = req?.user;

    const { jobId, resumeURL } = req.body;

    // Validate that jobId and resumeURL is provided
    if (!jobId || !resumeURL) return apiError(res, 400, "All details are required");
    
    // Find the job by ID
    const job = await Job.findById(jobId);
    if (!job) return apiError(res, 404, "Job not found");

    // Check if the user has already applied for the job
    const alreadyApplied = job.applications.some(
      (app) => app.applicantId.toString() === user?._id.toString()
    );
    if (alreadyApplied)
      return apiError(res, 400, "You have already applied for this job");

    // Add user to the list of applicants for the job
    const findUser = await User.findById(user?._id);
    findUser.jobsApplied.push({
      jobId: jobId
    });
    await findUser.save();

    job.applications.push({
      applicantId: user?._id,
      applicantName: `${user.firstName} ${user.lastName}`,
      email: user?.email,
      phone: user?.phone,
      resumeURL,
    });
    await job.save();

    // Return success response
    return res.status(200).json(new ApiResponse(200, {}, "Job applied"));
  } catch (error) {
    console.error("Failed to apply to this job: ", error);
    return apiError(res, 500, "Failed to apply job");
  }
});

// Controller to handle fetching all jobs
const getAllJobs = asyncHandler(async (req, res) => {
  try {
    const isAdmin = req.isAdmin;
    const id = req.user._id;

    if (isAdmin) {
      // If admin, fetch jobs posted by the admin
      const jobs = await Job.find({ postedBy: id }).select("-postedBy");
      if (!jobs) return apiError(res, 404, "Failed to find jobs");
      return res
        .status(200)
        .json(new ApiResponse(200, jobs, "Jobs fetched successfully"));
    }

    // If not admin, fetch all jobs
    const jobs = await Job.find().select("-postedBy");
    if (!jobs) return apiError(res, 404, "Failed to find jobs");
    return res
      .status(200)
      .json(new ApiResponse(200, jobs, "Jobs fetched successfully"));
  } catch (error) {
    console.error("Failed to fetch jobs list: ", error);
    return apiError(res, 500, "Failed to fetch jobs");
  }
});

// Controller to handle fetching job applicants
const getApplicants = asyncHandler(async (req, res) => {
  try {
    // Check if the user is an admin
    if (!req.isAdmin) return apiError(res, 401, "Unauthorised Access");
    const adminId = req?.user?._id;
    const { _id } = req.body;

    // Find the job by ID
    const job = await Job.findById(_id);
    if (!job) return apiError(res, 404, "Job not found");

    // Return the list of applicants for the job
    const applicants = job.applications;
    return res
      .status(200)
      .json(new ApiResponse(200, applicants, "Applications fetched"));
  } catch (error) {
    console.error("Failed to get applicants: ", error);
    return apiError(res, 500, "Failed to get applicants");
  }
});

export { postJob, editJob, deleteJob, applyJob, getAllJobs, getApplicants };
