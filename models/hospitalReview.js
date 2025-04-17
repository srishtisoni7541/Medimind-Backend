import mongoose from "mongoose";

const HospitalReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 }, // Overall rating (same as overall)
  comment: { type: String, maxlength: 500 },
  
  // Updated hospital-specific evaluation criteria
  staffFriendliness: { type: Number, min: 1, max: 5 },      // Staff Friendliness
  facilityClean: { type: Number, min: 1, max: 5 },          // Facility Cleanliness
  waitingTime: { type: Number, min: 1, max: 5 },            // Waiting Time
  accessibility: { type: Number, min: 1, max: 5 },          // Accessibility
  appointmentEase: { type: Number, min: 0, max: 5 },        // Appointment Scheduling Ease (optional)
  emergencyResponse: { type: Number, min: 0, max: 5 },      // Emergency Response Efficiency (optional)
  overall: { type: Number, min: 1, max: 5 },                // Overall Rating
  
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

const HospitalReviewModel = mongoose.model('HospitalReview', HospitalReviewSchema);
export default HospitalReviewModel