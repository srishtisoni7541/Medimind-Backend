import mongoose from "mongoose";

const DoctorReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who wrote the review
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true }, // Doctor being reviewed
  rating: { type: Number, required: true, min: 1, max: 5 }, // Overall rating (1-5 stars)
  comment: { type: String, maxlength: 500 }, // Optional comment
  hashtags: [{ 
    type: String, 
    enum: ["#KindAndCaring", "#GreatListener", "#RushedAppointments", "#ExplainsClearly", "#ToughButEffective","#Patient", "#Understanding","#Knowledgeable", "#CouldBeMoreAttentive","#AccurateDiagnosis", "#ConfusingExplanation","#Late", "#PoorCommunication"] // Enum for hashtags
  }], // Subjective hashtags

  // Doctor-specific evaluation criteria
  medicalAccuracy: { type: Number, min: 1, max: 5 }, // Accuracy of diagnosis and treatment
  clarityInExplanation: { type: Number, min: 1, max: 5 }, // How clearly the doctor explains conditions
  communicationSkills: { type: Number, min: 1, max: 5 }, // Doctor's communication skills
  punctuality: { type: Number, min: 1, max: 5 }, // Punctuality in appointments
  experienceAndExpertise: { type: Number, min: 1, max: 5 }, // Doctor's experience and expertise
  likes:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],
  createdAt: { type: Date, default: Date.now }, // Timestamp of the review
});

const DoctorReviewModel = mongoose.model('DoctorReview', DoctorReviewSchema);
export default DoctorReviewModel;
