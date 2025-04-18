import mongoose from "mongoose";

const CheckupSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: false, // Optional if you want to support anonymous sessions
  },
  age: {
    type: Number,
    required: true,
  },
  sex: {
    type: String,
    required: true,
    enum: ['Male', 'Female']
  },
  symptoms: {
    type: String,
    required: true,
  },
  conditions: [{
    name: String,
    probability: String,
    description: String
  }],
  selectedCondition: {
    name: String,
    probability: String,
    description: String
  },
  details: {
    overview: String,
    causes: String,
    riskFactors: [String],
    complications: [String],
    prevention: [String]
  },
  treatments: {
    medications: [{
      name: String,
      description: String
    }],
    homeCare: [String],
    lifestyle: [String],
    whenToSeeDoctor: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CheckupSession = mongoose.model('CheckupSession', CheckupSessionSchema);
export default CheckupSession;