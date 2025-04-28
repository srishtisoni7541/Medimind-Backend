import mongoose from "mongoose";

const donationRequestSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  requestType: { type: String, enum: ['blood', 'organ'], required: true },
  bloodType: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: function() { return this.requestType === 'blood'; }
  },
  organ: { 
    type: String,
    enum: ['kidney', 'liver', 'heart', 'lungs', 'pancreas', 'corneas', 'tissue', 'bone marrow'],
    required: function() { return this.requestType === 'organ'; }
  },
  urgency: { type: String, enum: ['routine', 'urgent', 'emergency'], default: 'routine' },
  patientCondition: { type: String },
  status: { type: String, enum: ['open', 'matched', 'completed', 'cancelled'], default: 'open' },
  matchedDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Donor' }],
  preferredDonationDate: { type: Date },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

const donationRequestModel = mongoose.models.DonationRequest || 
  mongoose.model('DonationRequest', donationRequestSchema);
export default donationRequestModel;