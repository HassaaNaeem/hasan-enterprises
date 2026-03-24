import mongoose from 'mongoose';

const plotDetailsSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  plotNumber: {
    type: String,
    trim: true
  },
  plotMapUri: {
    type: String
  },
  purchaserCnicCopyUri: {
    type: String
  },
  purchaserBankStatementUri: {
    type: String
  },
  companyFormUri: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'uploaded', 'verified', 'rejected'],
    default: 'pending'
  },
  documentId: {
    type: String
  },
  allotmentDocUri: {
    type: String
  },
  allocationDocUri: {
    type: String
  },
  possessionDocUri: {
    type: String
  },
  clearanceDocUri: {
    type: String
  },
  allotmentStatus: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending'
  },
  allocationStatus: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending'
  },
  possessionStatus: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending'
  },
  clearanceStatus: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending'
  },
  plotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plot',
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

const PlotDetails = mongoose.model('PlotDetails', plotDetailsSchema);
export default PlotDetails;
