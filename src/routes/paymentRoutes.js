import express from "express";
import {
  createPaymentSchedule,
  getPaymentSchedule,
  makePayment,
  getPaymentProgress,
  getMyPayments,
  checkOverduePayments,
  milestoneReached,
} from "../controllers/paymentController.js";
import { protect, authorize } from "../middleware/auth.js";
import { uploadFields } from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/schedule",
  protect,
  authorize("service_provider", "admin"),
  createPaymentSchedule
);
router.post(
  "/milestone-reached",
  protect,
  authorize("purchaser", "service_provider", "admin"),
  milestoneReached
);
router.get("/schedule/:plotId", protect, getPaymentSchedule);
router.get("/progress/:plotId", protect, getPaymentProgress);
router.get("/my-payments", protect, authorize("purchaser"), getMyPayments);

router.post(
  "/:installmentId/pay",
  protect,
  authorize("purchaser"),
  uploadFields,
  makePayment
);
router.post(
  "/check-overdue",
  protect,
  authorize("service_provider", "admin"),
  checkOverduePayments
);

export default router;
