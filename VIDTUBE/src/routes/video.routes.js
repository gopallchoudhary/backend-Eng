import { Router } from "express";
import {
  getAllVideos,
  publishAVideo,
  deleteVideo,
  getVideoById,
  updateVideo,
  togglePublishStatus,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/all-videos").get(verifyJWT, getAllVideos)

export default router;
