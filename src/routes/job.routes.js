import {Router } from "express";
import {editJob, postJob, applyJob, getAllJobs, deleteJob, getApplicants} from "../controllers/job.controller.js"
import {verifyLogin} from "../middlewares/verifyLogin.middleware.js"
const router = Router();

router.route("/post").post(verifyLogin, postJob)
router.route("/edit").put(verifyLogin, editJob)
router.route("/delete").delete(verifyLogin, deleteJob)
router.route("/apply").post(verifyLogin, applyJob)
router.route("/get").get(verifyLogin, getAllJobs)
router.route("/applications").get(verifyLogin, getApplicants)

export default router;

