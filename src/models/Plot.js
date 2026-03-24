import mongoose from 'mongoose';

const plotSchema = new mongoose.Schema({
  plotNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  area: {
    type: String,
    trim: true
  },
  dateOfSale: {
    type: Date
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'sold', 'on_hold'],
    default: 'available'
  },
  location: {
    type: String,
    trim: true
  },
  documentId: {
    type: String
  },
  dateOfPreparation: {
    type: Date
  },
  documentType: {
    type: String
  },
  totalValue: {
    type: mongoose.Types.Decimal128,
    default: 0,
    get: (v) => v ? parseFloat(v.toString()) : 0
  },
  purchaserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase'
  },
  serviceProviderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider'
  },
  imageUri: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { getters: true, virtuals: true },
  toObject: { getters: true, virtuals: true }
});

plotSchema.virtual('plotDetails', {
  ref: 'PlotDetails',
  localField: '_id',
  foreignField: 'plotId',
  justOne: true
});

const Plot = mongoose.model('Plot', plotSchema);
export default Plot;
