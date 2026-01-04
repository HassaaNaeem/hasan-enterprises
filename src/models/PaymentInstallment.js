import mongoose from "mongoose";

const paymentInstallmentSchema = new mongoose.Schema(
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
    dateOfPayment: {
      type: Date,
    },
    amountPaid: {
      type: mongoose.Types.Decimal128,
      default: 0,
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },
    balance: {
      type: mongoose.Types.Decimal128,
      default: 0,
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },
    receiptUri: {
      type: String,
    },
    proofUri: {
      type: String,
    },
    paymentScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentSchedule",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

const PaymentInstallment = mongoose.model(
  "PaymentInstallment",
  paymentInstallmentSchema
);
export default PaymentInstallment;
