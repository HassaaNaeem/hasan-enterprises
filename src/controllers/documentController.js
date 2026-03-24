import MilestoneDocument from "../models/MilestoneDocument.js";
import Plot from "../models/Plot.js";
import PlotDetails from "../models/PlotDetails.js";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

export const uploadDocument = async (req, res) => {
  try {
    const { plotId } = req.params;
    const { documentType, milestone } = req.body;

    if (!req.files || !req.files.document) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const plot = await Plot.findById(plotId);
    if (!plot)
      return res
        .status(404)
        .json({ success: false, message: "Plot not found" });

    // Service provider uploading must own the plot or be admin
    if (
      plot.serviceProviderId?.toString() !==
        req.user.serviceProviderId?.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to upload documents for this plot",
      });
    }

    const file = req.files.document[0];
    const filename = `${documentType.toLowerCase()}-${plotId}-${uuidv4()}.pdf`;
    const uri = `/uploads/documents/${filename}`;

    // Convert plotId to ObjectId for proper MongoDB query
    const plotObjectId = mongoose.Types.ObjectId.isValid(plotId)
      ? new mongoose.Types.ObjectId(plotId)
      : plotId;

    // Find the milestone document or create it
    let milestoneDoc = await MilestoneDocument.findOne({
      plotId: plotObjectId,
      percentage: milestone,
      documentType,
    });

    if (!milestoneDoc) {
      // Create new if not found (manual upload case)
      milestoneDoc = new MilestoneDocument({
        plotId: plotObjectId,
        percentage: milestone,
        documentType,
        status: "approved",
        generatedUri: uri,
        generatedAt: new Date(),
        approvedAt: new Date(),
      });
    } else {
      // Update existing
      milestoneDoc.generatedUri = uri;
      milestoneDoc.status = "approved";
      milestoneDoc.generatedAt = new Date();
      milestoneDoc.approvedAt = new Date();
      milestoneDoc.updatedAt = new Date();
    }

    await milestoneDoc.save();

    // Update PlotDetails with document URI
    const plotDetails = await PlotDetails.findOne({ plotId: plotObjectId });
    if (plotDetails) {
      const keyMap = {
        ALLOTMENT: "allotmentDocUri",
        ALLOCATION: "allocationDocUri",
        POSSESSION: "possessionDocUri",
        CLEARANCE: "clearanceDocUri",
      };
      const statusMap = {
        ALLOTMENT: "allotmentStatus",
        ALLOCATION: "allocationStatus",
        POSSESSION: "possessionStatus",
        CLEARANCE: "clearanceStatus",
      };
      const field = keyMap[documentType];
      const statusField = statusMap[documentType];
      if (field) plotDetails[field] = uri;
      if (statusField) plotDetails[statusField] = "approved";
      await plotDetails.save();
    }

    // If 100% milestone, mark plot as sold
    if (milestone === 100) {
      plot.status = "sold";
      await plot.save();
    }

    res.json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        documentId: milestoneDoc._id,
        documentUri: uri,
        documentType: milestoneDoc.documentType,
        status: milestoneDoc.status, // Will be 'generated'
        plotId: milestoneDoc.plotId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPlotDocuments = async (req, res) => {
  try {
    const { plotId } = req.params;

    const plot = await Plot.findById(plotId);
    if (!plot) {
      console.log("Plot not found for plotId:", plotId);
      return res
        .status(404)
        .json({ success: false, message: "Plot not found" });
    }

    // Purchaser can view their own plot; SP can view theirs
    const userPurchaserId = req.user.purchaserId?.toString();
    const userServiceProviderId = req.user.serviceProviderId?.toString();
    const plotPurchaserId = plot.purchaserId?.toString();
    const plotServiceProviderId = plot.serviceProviderId?.toString();

    const hasAccess =
      req.user.role === "admin" ||
      userPurchaserId === plotPurchaserId ||
      userServiceProviderId === plotServiceProviderId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view documents for this plot",
      });
    }

    // Convert plotId to ObjectId for proper MongoDB query
    const plotObjectId = mongoose.Types.ObjectId.isValid(plotId)
      ? new mongoose.Types.ObjectId(plotId)
      : plotId;

    // Fetch ALL milestone documents for this plot
    // DO NOT filter by status - frontend needs all statuses (ready, generated, approved)
    const documents = await MilestoneDocument.find({ plotId: plotObjectId })
      .select(
        "documentType percentage status generatedUri approvedAt approvedBy",
      )
      .sort({ percentage: 1 }); // Sort by milestone percentage

    const plotDetails = await PlotDetails.findOne({
      plotId: plotObjectId,
    }).select(
      "allotmentDocUri allocationDocUri possessionDocUri clearanceDocUri allotmentStatus allocationStatus possessionStatus clearanceStatus",
    );

    res.json({
      success: true,
      data: {
        plot: { _id: plot._id, plotNumber: plot.plotNumber },
        documents, // MUST include status='ready' documents
        plotDetails,
      },
    });
  } catch (error) {
    console.error("Error in getPlotDocuments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const md = await MilestoneDocument.findById(documentId).populate("plotId");
    if (!md)
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });

    // Check access
    const userPurchaserId = req.user.purchaserId?.toString();
    const userServiceProviderId = req.user.serviceProviderId?.toString();
    const plotPurchaserId = md.plotId.purchaserId?.toString();
    const plotServiceProviderId = md.plotId.serviceProviderId?.toString();

    const hasAccess =
      req.user.role === "admin" ||
      userPurchaserId === plotPurchaserId ||
      userServiceProviderId === plotServiceProviderId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to download this document",
      });
    }

    // Return document metadata and URI
    res.json({
      success: true,
      data: {
        documentId: md._id,
        documentType: md.documentType,
        percentage: md.percentage,
        uri: md.generatedUri,
        status: md.status,
        approvedAt: md.approvedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
