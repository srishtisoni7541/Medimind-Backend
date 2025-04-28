import mongoose from "mongoose";

const donorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  bloodType: { 
    type: String, 
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  organDonor: { type: Boolean, default: false },
  organs: [{ 
    type: String,
    enum: ['kidney', 'liver', 'heart', 'lungs', 'pancreas', 'corneas', 'tissue', 'bone marrow']
  }],
  lastDonated: { type: Date },
  medicalConditions: [{ type: String }],
  medications: [{ type: String }],
  available: { type: Boolean, default: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  createdAt: { type: Date, default: Date.now }
}, { minimize: false });

// Create an index on location field for geospatial queries
donorSchema.index({ location: '2dsphere' });

const donorModel = mongoose.models.Donor || mongoose.model('Donor', donorSchema);
export default donorModel;