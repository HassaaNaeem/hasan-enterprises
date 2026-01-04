import express from "express";
import {
  getAllPlots,
  getPlotById,
  createPlot,
  applyForPlot,
  uploadPlotDocuments,
  verifyPlotDocuments,
  updatePlot,
  getMyPlots,
} from "../controllers/plotController.js";
import { protect, authorize } from "../middleware/auth.js";
import { uploadFields } from "../middleware/upload.js";

const router = express.Router();

router.get("/", protect, getAllPlots);
router.get("/my-plots", protect, authorize("purchaser"), getMyPlots);
router.get("/:id", protect, getPlotById);

router.post("/", protect, authorize("service_provider", "admin"), uploadFields, createPlot);
router.post("/:plotId/apply", protect, authorize("purchaser"), applyForPlot);
router.post(
  "/:plotId/documents",
  protect,
  authorize("purchaser"),
  uploadFields,
  uploadPlotDocuments
); // not working

router.put(
  "/:plotId/verify",
  protect,
  authorize("service_provider", "admin"),
  verifyPlotDocuments
);
router.put("/:id", protect, authorize("service_provider", "admin"), updatePlot);

export default router;
