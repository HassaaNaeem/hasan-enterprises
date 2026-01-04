import Plot from "../models/Plot.js";
import PlotDetails from "../models/PlotDetails.js";
import Purchase from "../models/Purchase.js";
import { v4 as uuidv4 } from "uuid";
import { getRequiredDocuments } from "../utils/milestoneService.js";

export const getAllPlots = async (req, res) => {
  try {
    const { status, location, area } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (area) filter.area = { $regex: area, $options: "i" };

    const plots = await Plot.find(filter)
      .populate("purchaserId", "name cnicNumber phoneNumber")
      .populate("serviceProviderId", "name")
      .populate("plotDetails");

    res.json({ success: true, count: plots.length, data: plots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPlotById = async (req, res) => {
  try {
    const plot = await Plot.findById(req.params.id)
      .populate("purchaserId")
      .populate("serviceProviderId");

    if (!plot) {
      return res
        .status(404)
        .json({ success: false, message: "Plot not found" });
    }

    const plotDetails = await PlotDetails.findOne({ plotId: plot._id });

    res.json({ success: true, data: { plot, plotDetails } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPlot = async (req, res) => {
  try {
    const { plotNumber, area, location, totalValue, documentType } = req.body;

    const existingPlot = await Plot.findOne({ plotNumber });
    if (existingPlot) {
      return res
        .status(400)
        .json({ success: false, message: "Plot number already exists" });
    }

    const plot = await Plot.create({
      plotNumber,
      area,
      location,
      totalValue,
      documentType,
      status: "available",
      documentId: uuidv4(),
      dateOfPreparation: new Date(),
    });

    res.status(201).json({ success: true, data: plot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const applyForPlot = async (req, res) => {
  try {
    const { plotId } = req.params;
    const purchaserId = req.user.purchaserId;

    if (!purchaserId) {
      return res.status(403).json({
        success: false,
        message: "Only purchasers can apply for plots",
      });
    }

    const plot = await Plot.findById(plotId);
    if (!plot) {
      return res
        .status(404)
        .json({ success: false, message: "Plot not found" });
    }

    if (plot.status !== "available") {
      return res
        .status(400)
        .json({ success: false, message: "Plot is not available" });
    }

    plot.purchaserId = purchaserId;
    plot.status = "reserved";
    plot.dateOfSale = new Date();
    await plot.save();

    let plotDetails = await PlotDetails.findOne({ plotId: plot._id });
    if (!plotDetails) {
      plotDetails = await PlotDetails.create({
        plotId: plot._id,
        plotNumber: plot.plotNumber,
        name: `Plot ${plot.plotNumber} Details`,
        status: "pending",
        documentId: uuidv4(),
      });
    }

    const requiredDocuments = getRequiredDocuments();

    res.status(201).json({
      success: true,
      message: "Plot application submitted successfully",
      data: {
        plot,
        plotDetails,
        requiredDocuments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// export const uploadPlotDocuments = async (req, res) => {
//   try {
//     const { plotId } = req.params;

//     const plotDetails = await PlotDetails.findOne({ plotId });
//     if (!plotDetails) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Plot details not found" });
//     }

//     const plot = await Plot.findById(plotId);
//     if (plot.purchaserId?.toString() !== req.user.purchaserId?.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: "Not authorized to upload documents for this plot",
//       });
//     }

//     console.log("Plot found:", plotId);
//     console.log(
//       "Files received:",
//       req.files ? Object.keys(req.files) : "No files"
//     );

//     if (req.files) {
//       if (req.files.plotMap) {
//         plotDetails.plotMapUri = `uploads/${req.files.plotMap[0].filename}`;
//       }
//       if (req.files.cnicCopy) {
//         plotDetails.purchaserCnicCopyUri = `uploads/${req.files.cnicCopy[0].filename}`;
//       }
//       if (req.files.bankStatement) {
//         plotDetails.purchaserBankStatementUri = `uploads/${req.files.bankStatement[0].filename}`;
//       }
//       if (req.files.companyForm) {
//         plotDetails.companyFormUri = `uploads/${req.files.companyForm[0].filename}`;
//       }
//     }

//     const allDocsUploaded =
//       plotDetails.plotMapUri &&
//       plotDetails.purchaserCnicCopyUri &&
//       plotDetails.purchaserBankStatementUri &&
//       plotDetails.companyFormUri;

//     if (allDocsUploaded) {
//       plotDetails.status = "uploaded";
//     }

//     console.log("Saving plot details:", plotDetails);

//     await plotDetails.save();
//     console.log("Plot details saved successfully");

//     res.json({
//       success: true,
//       message: `Documents ${plotDetails.status} successfully`,
//       data: plotDetails,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
export const uploadPlotDocuments = async (req, res) => {
  try {
    const { plotId } = req.params;

    console.log("=== REQUEST DEBUG INFO ===");
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);
    console.log("req.file:", req.file);
    console.log("========================");
    const plotDetails = await PlotDetails.findOne({ plotId });
    if (!plotDetails) {
      return res
        .status(404)
        .json({ success: false, message: "Plot details not found" });
    }

    const plot = await Plot.findById(plotId);
    if (plot.purchaserId?.toString() !== req.user.purchaserId?.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to upload documents for this plot",
      });
    }

    console.log("Plot found:", plotId);
    console.log(
      "Files received:",
      req.files ? Object.keys(req.files) : "No files"
    );

    if (req.files) {
      if (req.files.plotMap) {
        plotDetails.plotMapUri = `uploads/plotMap/${req.files.plotMap[0].filename}`;
      }
      if (req.files.cnicCopy) {
        plotDetails.purchaserCnicCopyUri = `uploads/cnicCopy/${req.files.cnicCopy[0].filename}`;
      }
      if (req.files.bankStatement) {
        plotDetails.purchaserBankStatementUri = `uploads/bankStatement/${req.files.bankStatement[0].filename}`;
      }
      if (req.files.companyForm) {
        plotDetails.companyFormUri = `uploads/companyForm/${req.files.companyForm[0].filename}`;
      }
    }

    const allDocsUploaded =
      plotDetails.plotMapUri &&
      plotDetails.purchaserCnicCopyUri &&
      plotDetails.purchaserBankStatementUri &&
      plotDetails.companyFormUri;

    if (allDocsUploaded) {
      plotDetails.status = "uploaded";
    }

    console.log("Saving plot details:", plotDetails);

    await plotDetails.save();
    console.log("Plot details saved successfully");

    res.json({
      success: true,
      message: `Documents ${plotDetails.status} successfully`,
      data: plotDetails,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPlotDocuments = async (req, res) => {
  try {
    const { plotId } = req.params;
    const { status, serviceProviderId } = req.body;

    // Validate status
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "verified" or "rejected"'
      });
    }

    const plotDetails = await PlotDetails.findOne({ plotId });
    if (!plotDetails) {
      return res
        .status(404)
        .json({ success: false, message: "Plot details not found" });
    }

    // Update PlotDetails status
    plotDetails.status = status; // 'verified' or 'rejected'
    plotDetails.updatedAt = new Date();
    await plotDetails.save();

    if (status === "verified") {
      const plot = await Plot.findById(plotId);
      plot.serviceProviderId = serviceProviderId || req.user.serviceProviderId;
      await plot.save();
    }

    res.json({
      success: true,
      message: `Documents ${status} successfully`,
      data: plotDetails,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePlot = async (req, res) => {
  try {
    const plot = await Plot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!plot) {
      return res
        .status(404)
        .json({ success: false, message: "Plot not found" });
    }

    res.json({ success: true, data: plot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyPlots = async (req, res) => {
  try {
    const purchaserId = req.user.purchaserId;

    if (!purchaserId) {
      return res.status(403).json({
        success: false,
        message: "Only purchasers can view their plots",
      });
    }

    const plots = await Plot.find({ purchaserId }).populate(
      "serviceProviderId",
      "name phoneNumber"
    );

    const plotsWithDetails = await Promise.all(
      plots.map(async (plot) => {
        const details = await PlotDetails.findOne({ plotId: plot._id });
        return { plot, details };
      })
    );

    res.json({ success: true, count: plots.length, data: plotsWithDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
