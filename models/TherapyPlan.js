import mongoose from 'mongoose';

const therapyPlanSchema = new mongoose.Schema({
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: true,
  // },
  title: {
    type: String,
    required: true,
  },
  description: String,
  techniques: [{
    name: String,
    description: String,
    frequency: String,
    completed: [Date],
  }],
  goals: [{
    description: String,
    targetDate: Date,
    completed: Boolean,
    progress: Number, // 0-100%
  }],
  resources: [{
    type: { type: String, enum: ['article', 'video', 'exercise', 'professional'] },
    title: String,
    description: String,
    link: String,
    completed: Boolean,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  aiGenerated: {
    type: Boolean,
    default: true,
  },
});

therapyPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const TherapyPlan = mongoose.model('TherapyPlan', therapyPlanSchema);
export default TherapyPlan;