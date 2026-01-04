import mongoose from "mongoose";

const paymentScheduleSchema = new mongoose.Schema(
  {
    amount: {
      type: mongoose.Types.Decimal128,
      required: true,
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },
    dueDate: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "partial", "failed"],
      default: "pending",
    },
    installmentNumber: {
      type: Number,
      required: true,
    },
    plotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plot",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

const PaymentSchedule = mongoose.model(
  "PaymentSchedule",
  paymentScheduleSchema
);
export default PaymentSchedule;
