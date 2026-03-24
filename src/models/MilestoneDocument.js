import mongoose from 'mongoose';

const milestoneDocumentSchema = new mongoose.Schema({
  plotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plot',
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  documentType: {
    type: String,
    enum: ['ALLOTMENT', 'ALLOCATION', 'POSSESSION', 'CLEARANCE'],
    required: true,
  },
  status: {
    type: String,
    enum: ['ready', 'generated', 'approved'],
    default: 'ready',
  },
  generatedUri: {
    type: String,
  },
  generatedAt: {
    type: Date,
  },
  approvedAt: {
    type: Date,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvalNotes: {
    type: String,
  },
}, { timestamps: true });

// Add compound index to prevent duplicates
milestoneDocumentSchema.index({ plotId: 1, percentage: 1, documentType: 1 }, { unique: true });

const MilestoneDocument = mongoose.model('MilestoneDocument', milestoneDocumentSchema);
export default MilestoneDocument;
