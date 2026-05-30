import express from "express";
import { savePost, unsavePost, getSaved } from "../controllers/saved.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",            protect, getSaved);
router.post("/:postId",   protect, savePost);
router.delete("/:postId", protect, unsavePost);

export default router;
