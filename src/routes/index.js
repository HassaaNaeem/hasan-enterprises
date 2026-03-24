import express from "express";
import authRoutes from "./authRoutes.js";
import plotRoutes from "./plotRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import caseRoutes from "./caseRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import documentsRoutes from "./documentsRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/plots", plotRoutes);
router.use("/payments", paymentRoutes);
router.use("/cases", caseRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/documents", documentsRoutes);

export default router;
