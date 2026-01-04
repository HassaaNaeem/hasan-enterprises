import PaymentSchedule from "../models/PaymentSchedule.js";
import PaymentInstallment from "../models/PaymentInstallment.js";
import Plot from "../models/Plot.js";
import { v4 as uuidv4 } from "uuid";
import {
  checkAndIssueMilestoneDocuments,
  calculatePaymentProgress,
} from "../utils/milestoneService.js";

export const createPaymentSchedule = async (req, res) => {
  try {
    const { plotId, installments } = req.body;

    const plot = await Plot.findById(plotId);
    if (!plot) {
      return res
        .status(404)
        .json({ success: false, message: "Plot not found" });
    }

    if (plot.status !== "reserved") {
      return res.status(400).json({
        success: false,
        message: "Plot must be reserved before creating payment schedule",
      });
    }

    const existingSchedules = await PaymentSchedule.find({ plotId });
    if (existingSchedules.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Payment schedule already exists for this plot",
      });
    }

    const createdSchedules = [];
    for (const inst of installments) {
      const schedule = await PaymentSchedule.create({
        amount: inst.amount,
        dueDate: inst.dueDate,
        status: "pending",
        installmentNumber: inst.installmentNumber,
        plotId,
      });

      const installment = await PaymentInstallment.create({
        amount: inst.amount,
        dueDate: inst.dueDate,
        status: "pending",
        balance: inst.amount,
        amountPaid: 0,
        paymentScheduleId: schedule._id,
      });

      createdSchedules.push({ schedule, installment });
    }

    res.status(201).json({
      success: true,
      message: "Payment schedule created successfully",
      data: createdSchedules,
      installments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentSchedule = async (req, res) => {
  try {
    const { plotId } = req.params;

    const schedules = await PaymentSchedule.find({ plotId }).sort({
      installmentNumber: 1,
    });

    const schedulesWithInstallments = await Promise.all(
      schedules.map(async (schedule) => {
        const installments = await PaymentInstallment.find({
          paymentScheduleId: schedule._id,
        });
        return { schedule, installments };
      })
    );

    const progress = await calculatePaymentProgress(plotId);

    res.json({
      success: true,
      data: {
        schedules: schedulesWithInstallments,
        progress,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const makePayment = async (req, res) => {
  try {
    const { installmentId } = req.params;
    const { amountPaid, proofUri } = req.body;

    const installment = await PaymentInstallment.findById(installmentId);
    if (!installment) {
      return res
        .status(404)
        .json({ success: false, message: "Installment not found" });
    }

    const schedule = await PaymentSchedule.findById(
      installment.paymentScheduleId
    );
    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "Payment schedule not found" });
    }

    const plot = await Plot.findById(schedule.plotId);
    if (plot.purchaserId?.toString() !== req.user.purchaserId?.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to make payment for this plot",
      });
    }

    const currentPaid = parseFloat(installment.amountPaid?.toString() || "0");
    const newTotalPaid = currentPaid + amountPaid;
    const installmentAmount = parseFloat(installment.amount?.toString() || "0");
    const newBalance = installmentAmount - newTotalPaid;

    installment.amountPaid = newTotalPaid;
    installment.balance = Math.max(0, newBalance);
    installment.dateOfPayment = new Date();

    if (req.files && req.files.paymentProof) {
      installment.proofUri = `/uploads/${req.files.paymentProof[0].filename}`;
    } else if (proofUri) {
      installment.proofUri = proofUri;
    }

    if (newBalance <= 0) {
      installment.status = "paid";
      schedule.status = "paid";
    } else {
      installment.status = "partial";
      schedule.status = "partial";
    }

    installment.receiptUri = `/receipts/${uuidv4()}.pdf`;

    await installment.save();
    await schedule.save();

    const milestoneResult = await checkAndIssueMilestoneDocuments(
      schedule.plotId
    );

    res.json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        installment,
        schedule,
        receiptUri: installment.receiptUri,
        milestone: milestoneResult,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentProgress = async (req, res) => {
  try {
    const { plotId } = req.params;
    const progress = await calculatePaymentProgress(plotId);

    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyPayments = async (req, res) => {
  try {
    const purchaserId = req.user.purchaserId;

    if (!purchaserId) {
      return res.status(403).json({
        success: false,
        message: "Only purchasers can view their payments",
      });
    }

    const plots = await Plot.find({ purchaserId });
    const plotIds = plots.map((p) => p._id);

    const schedules = await PaymentSchedule.find({
      plotId: { $in: plotIds },
    }).populate("plotId", "plotNumber area location");

    const paymentsWithDetails = await Promise.all(
      schedules.map(async (schedule) => {
        const installments = await PaymentInstallment.find({
          paymentScheduleId: schedule._id,
        });
        return { schedule, installments };
      })
    );

    res.json({ success: true, data: paymentsWithDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkOverduePayments = async (req, res) => {
  try {
    const today = new Date();

    const overdueInstallments = await PaymentInstallment.find({
      dueDate: { $lt: today },
      status: { $in: ["pending", "partial"] },
    }).populate("paymentScheduleId");

    for (const inst of overdueInstallments) {
      inst.status = "overdue";
      await inst.save();

      if (inst.paymentScheduleId) {
        const schedule = await PaymentSchedule.findById(
          inst.paymentScheduleId._id
        );
        schedule.status = "overdue";
        await schedule.save();
      }
    }

    res.json({
      success: true,
      message: `${overdueInstallments.length} overdue payments updated`,
      data: overdueInstallments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
