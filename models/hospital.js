import mongoose from "mongoose";

const HospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone:{
    type: Number,
  },
  isVerified: { type: Boolean, default: false},
  specialties: [{ type: String }],
  address: { type: String },
  rating: { type: Number, default: 0 }, // Average rating
  doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'doctor' }],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'HospitalReview' }], // Reference to hospital reviews
  operatingHours: {type:String}, // Available appointment slots
  providesUrgentCare: { type: Boolean, default: false }, // Emergency care option
  hospitalType: { type: String, enum: ['general', 'university','local clinic','traditional korean medicine clinic'], required: true },
});
const hospitalModel = mongoose.model('Hospital', HospitalSchema);
export default hospitalModel