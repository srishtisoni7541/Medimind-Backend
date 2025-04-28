import mongoose from 'mongoose';

const journalEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  mood: {
    type: Number, // Scale from 1-10
    required: true,
    min: 1,
    max: 10,
  },
  emotions: [{
    type: String,
    enum: ['happy', 'sad', 'anxious', 'calm', 'angry', 'content', 'stressed', 'energetic', 'tired', 'hopeful', 'fearful', 'grateful'],
  }],
  activities: [{
    type: String,
  }],
  tags: [{
    type: String,
  }],
  aiAnalysis: {
    sentimentScore: Number,
    emotionalTone: String,
    suggestedActivities: [String],
    insights: String,
    warningFlags: [String], // For potentially concerning patterns
    createdAt: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for better querying
journalEntrySchema.index({ user: 1, createdAt: -1 });

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
export default JournalEntry;