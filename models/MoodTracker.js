import mongoose from 'mongoose';

const moodTrackerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  mood: {
    type: Number,
    required: true, 
    min: 1,
    max: 10,
  },
  note: {
    type: String,
    trim: true,
  },
  factors: [{
    factor: String,
    impact: { type: Number, min: -5, max: 5 } // Negative impact to positive impact
  }],
});

// Create compound index for user and date
moodTrackerSchema.index({ user: 1, date: -1 });

const MoodTracker = mongoose.model('MoodTracker', moodTrackerSchema);
export default MoodTracker;