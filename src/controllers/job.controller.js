import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Job } from "../models/job.model.js";
import mongoose from "mongoose";
import {User} from "../models/user.model.js"
const postJob = asyncHandler(async (req, res) => {
  try {
    if (!req.isAdmin) return apiError(res, 401, "Unauthorises Access");
    const adminId = req?.user?._id;
    const { companyName, position, contract, location } = req.body;
    if (
      [companyName, position, contract, location].some(
        (field) => field?.trim() === ""
      )
    )
      return apiError(res, 400, "All fields are required");

    const job = await Job.create({
      companyName,
      position,
      contract,
      location,
      postedBy: adminId,
    });

    const createdJob = await Job.findById(job._id);
    if (!createdJob) return apiError(res, 500, "Failed to post job");
    return res.status(201).json(new ApiResponse(201, createdJob, "Job Posted"));
  } catch (error) {
    console.error("Error while posting job: ", error);
    return apiError(res, 500, "Failed to post job");
  }
});

const editJob = asyncHandler(async (req, res) => {
  try {
    if (!req.isAdmin) return apiError(res, 401, "Unauthorises Access");
    const adminId = req?.user?._id;

    const { jobId, companyName, position, contract, location } = req.body;
    if (
      [jobId, companyName, position, contract, location].some(
        (field) => field?.trim() === ""
      )
    )
      return apiError(res, 400, "All fields are required");

    const _id = new mongoose.Types.ObjectId(jobId);

    const findJob = await Job.findById(_id);
    if (!findJob) return apiError(res, 404, "Job not found");

    const postedBy = findJob.postedBy;

    if (adminId.toString() !== postedBy.toString())
      return apiError(res, 403, "Don't have access to edit this job");

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

    return res
      .status(200)
      .json(new ApiResponse(200, updatedJob, "Job updated"));
  } catch (error) {
    console.error("Failed to update job: ", error);
    return apiError(res, 500, "Failed to update job");
  }
});

const deleteJob = asyncHandler(async (req, res) => {
  try {
    if (!req.isAdmin) return apiError(res, 401, "Unauthorises Access");
    const adminId = req?.user?._id;

    const { _id } = req.body;

    const job = await Job.findById(_id);
    if (!job) return apiError(res, 404, "Job not found");
    const postedBy = job.postedBy;
    if (adminId.toString() !== postedBy.toString())
      return apiError(res, 403, "Don't have access to delete this job");

    const deleteJob = await Job.findByIdAndDelete(_id);
    if (!deleteJob) return apiError(res, 404, "Job not found");

    return res.status(200).json(new ApiResponse(200, {}, "Job deleted"));
  } catch (error) {
    console.error("Failed to delete job: ", error);
    return apiError(res, 500, "Failed to delete job");
  }
});

const applyJob = asyncHandler(async (req, res) => {
  try {
    if (req.isAdmin) return apiError(res, 401, "Admin account cannot apply");
    const user= req?.user;

    const { jobId } = req.body;
    if (!jobId) return apiError(res, 400, "All details are required");
    
    const job = await Job.findById(jobId);
    if (!job) return apiError(res, 404, "Job not found");

    const alreadyApplied = job.applications.some(
      (app) => app.applicantId.toString() === user?._id.toString()
    );
    if (alreadyApplied)
      return apiError(res, 400, "You have already applied for this job");

    const findUser = await User.findById(user?._id)
    findUser.jobsApplied.push({
      jobId: jobId
    })
    await findUser.save()
    job.applications.push({
      applicantId: user?._id,
      applicantName: `${user.firstName} ${user.lastName}`,
      email: user?.email,
      phone: user?.phone
    });
    await job.save();

    return res.status(200).json(new ApiResponse(200, {}, "Job applied"));
  } catch (error) {
    console.error("Failed to apply to this job: ", error);
    return apiError(res, 500, "Failed to apply job");
  }
});

const getAllJobs = asyncHandler(async (req, res) => {
  try {
    const isAdmin = req.isAdmin;
    const id = req.user._id
    if (isAdmin) {
      const jobs = await Job.find({postedBy: id}).select("-postedBy");
      if (!jobs) return apiError(res, 404, "Failed to find jobs");
      return res
        .status(200)
        .json(new ApiResponse(200, jobs, "Jobs fetched successfully"));
    }
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

const getApplicants = asyncHandler(async (req, res) => {
  try {
    if (!req.isAdmin) return apiError(res, 401, "Unauthorises Access");
    const adminId = req?.user?._id;
    const { _id } = req.body;

    const job = await Job.findById(_id);
    if (!job) return apiError(res, 404, "Job not found");
    const applicants = job.applications;

    return res
      .status(200)
      .json(new ApiResponse(200, applicants, "Applications fetched"));
  } catch {
    console.error("Failed to get applicants: ", error);
    return apiError(res, 500, "Failed to get applicants");
  }
});

// const getApplicants = asyncHandler(async (req, res) => {
//     try {
//         // Check if the user is an admin
//         if (!req.isAdmin) return apiError(res, 401, "Unauthorized Access");

//         // Extract job ID from the request body
//         const { _id: jobId } = req.body;

//         // Define the aggregation pipeline
//         const pipeline = [
//             { $match: { _id: jobId } }, // Match the job by ID
//             { $unwind: "$applications" }, // Unwind the applications array
//             {
//                 $lookup: {
//                     from: "users", // Collection name in MongoDB
//                     localField: "applications.applicantId",
//                     foreignField: "_id",
//                     as: "applicantDetails"
//                 }
//             },
//             { $unwind: "$applicantDetails" }, // Unwind the applicantDetails array
//             {
//                 $project: {
//                     _id: 0, // Exclude the job ID from the final output
//                     "applications.applicantId": 1,
//                     "applications.resumeURL": 1,
//                     "applications.dateApplied": 1,
//                     "applicantDetails._id": 1,
//                     "applicantDetails.firstName": 1,
//                     "applicantDetails.lastName": 1,
//                     "applicantDetails.email": 1,
//                     "applicantDetails.phone": 1
//                 }
//             }
//         ];

//         // Execute the aggregation pipeline
//         const result = await Job.aggregate(pipeline);

//         // Check if the job exists
//         if (result.length === 0) return apiError(res, 404, "Job not found");

//         // Extract and format the list of applicants
//         const applicants = result.map(doc => ({
//             applicantId: doc.applicantDetails._id,
//             firstName: doc.applicantDetails.firstName,
//             lastName: doc.applicantDetails.lastName,
//             email: doc.applicantDetails.email,
//             phone: doc.applicantDetails.phone,
//             resumeURL: doc.applications.resumeURL,
//             dateApplied: doc.applications.dateApplied
//         }));

//         // Send a success response with the list of applicants
//         return res.status(200).json(
//             new ApiResponse(200, applicants, "Applications fetched")
//         );
//     } catch (error) {
//         console.error("Failed to get applicants: ", error);
//         return apiError(res, 500, "Failed to get applicants");
//     }
// });
export { postJob, editJob, deleteJob, applyJob, getAllJobs, getApplicants };
