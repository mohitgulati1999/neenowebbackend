import mongoose from 'mongoose';

const feeTemplateSchema = new mongoose.Schema({
  templateId: {
    type: String,
    required: true,
    unique: true, 
  },
  name: {
    type: String,
    required: true,
    trim: true, 
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  classIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: false, 
  }],
  fees: [
    {
      feesGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeesGroup',
        required: true,
      },
      feeTypes: [
        {
          feesType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FeesType',
            required: true,
          },
          amount: {
            type: Number,
            required: true,
            min: 0, 
          },
        },
      ],
    },
  ],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});


export default mongoose.model('FeeTemplate', feeTemplateSchema);