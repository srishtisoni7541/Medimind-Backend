import donorModel from '../models/donorModel.js';

// Register a new donor
export const registerDonor = async (req, res) => {
  try {
    const { bloodType, organDonor, organs, medicalConditions, medications, location } = req.body;
    
    // Check if user is already registered as a donor
    const existingDonor = await donorModel.findOne({ user: req.user._id });
    if (existingDonor) {
      return res.status(400).json({ message: 'User is already registered as a donor' });
    }
    
    const newDonor = new donorModel({
      user: req.user._id,
      bloodType,
      organDonor,
      organs: organDonor ? organs : [],
      medicalConditions,
      medications,
      location: {
        type: 'Point',
        coordinates: location.coordinates // [longitude, latitude]
      }
    });
    
    await newDonor.save();
    res.status(201).json({ 
      message: 'Donor registered successfully',
      donor: newDonor
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update donor profile
export const updateDonorProfile = async (req, res) => {
  try {
    const { bloodType, organDonor, organs, medicalConditions, medications, location } = req.body;
    
    const donor = await donorModel.findOne({ user: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }
    
    donor.bloodType = bloodType || donor.bloodType;
    donor.organDonor = organDonor !== undefined ? organDonor : donor.organDonor;
    donor.organs = organDonor && organs ? organs : donor.organs;
    donor.medicalConditions = medicalConditions || donor.medicalConditions;
    donor.medications = medications || donor.medications;
    
    if (location && location.coordinates) {
      donor.location = {
        type: 'Point',
        coordinates: location.coordinates
      };
    }
    
    await donor.save();
    res.status(200).json({ 
      message: 'Donor profile updated successfully',
      donor
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get donor profile
export const getDonorProfile = async (req, res) => {
  try {
    const donor = await donorModel.findOne({ user: req.user._id })
      .populate('user', 'name email image phone');
    
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }
    
    res.status(200).json({ donor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search for donors (for hospitals)
export const searchDonors = async (req, res) => {
  
    
  try {
    const { bloodType, organ, maxDistance, coordinates } = req.query;
    
    const query = { available: true };
    
    if (bloodType) {
      query.bloodType = bloodType;
    }
    
    if (organ) {
      query.organDonor = true;
      query.organs = { $in: [organ] };
    }
    
    let donors;
    
    if (coordinates && coordinates.length === 2) {
      // Perform geospatial query if coordinates are provided
      const [longitude, latitude] = coordinates.split(',').map(Number);
      
      donors = await donorModel.find({
        ...query,
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: maxDistance ? parseInt(maxDistance) * 1000 : 10000 // Convert km to meters
          }
        }
      }).populate('user', 'name email phone');
      
    } else {
      // Regular query without geospatial constraints
      donors = await donorModel.find(query).populate('user', 'name email phone');
    }
    
    res.status(200).json({ donors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Set donor availability
export const setDonorAvailability = async (req, res) => {
  try {
    const { available } = req.body;
    
    const donor = await donorModel.findOne({ user: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }
    
    donor.available = available;
    await donor.save();
    
    res.status(200).json({ 
      message: `Donor status updated to ${available ? 'available' : 'unavailable'}`,
      donor
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
