import mongoose from "mongoose";

const donationSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'DonationRequest' },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  donationType: { type: String, enum: ['blood', 'organ'], required: true },
  bloodType: { type: String },
  organ: { type: String },
  donationDate: { type: Date, default: Date.now },
  amount: { type: Number }, // For blood donations (in mL)
  notes: { type: String },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' }
});

const donationModel = mongoose.models.Donation || mongoose.model('Donation', donationSchema);
export default donationModel;