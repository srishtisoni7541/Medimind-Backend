import donationRequestModel from '../models/donationRequestModel.js';
import donorModel from '../models/donorModel.js';
import hospitalModel from '../models/hospital.js';

// Create a new donation request
export const createDonationRequest = async (req, res) => {
  try {
    const { 
      requestType, bloodType, organ, urgency, 
      patientCondition, preferredDonationDate, notes 
    } = req.body;
    
    if (!req.hospital) {
      return res.status(403).json({ message: 'Only hospitals can create donation requests' });
    }
    
    // Set expiration date (defaults to 7 days from now for routine, 2 days for urgent, 1 day for emergency)
    let expiresAt = new Date();
    if (urgency === 'routine') {
      expiresAt.setDate(expiresAt.getDate() + 7);
    } else if (urgency === 'urgent') {
      expiresAt.setDate(expiresAt.getDate() + 2);
    } else if (urgency === 'emergency') {
      expiresAt.setDate(expiresAt.getDate() + 1);
    }
    
    const newRequest = new donationRequestModel({
      hospital: req.hospital._id,
      requestType,
      bloodType: requestType === 'blood' ? bloodType : undefined,
      organ: requestType === 'organ' ? organ : undefined,
      urgency,
      patientCondition,
      preferredDonationDate,
      notes,
      expiresAt
    });
    
    await newRequest.save();
    
    // If emergency, automatically search for matching donors
    if (urgency === 'emergency') {
      const matchQuery = {
        available: true
      };
      
      if (requestType === 'blood') {
        matchQuery.bloodType = bloodType;
      } else if (requestType === 'organ') {
        matchQuery.organDonor = true;
        matchQuery.organs = { $in: [organ] };
      }
      
      const matchedDonors = await donorModel.find(matchQuery)
        .populate('user', 'name email phone');
      
      // Update the request with matched donors
      if (matchedDonors.length > 0) {
        newRequest.matchedDonors = matchedDonors.map(donor => donor._id);
        await newRequest.save();
      }
    }
    
    res.status(201).json({
      message: 'Donation request created successfully',
      request: newRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a donation request
export const updateDonationRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { urgency, patientCondition, preferredDonationDate, notes, status } = req.body;
    
    const request = await donationRequestModel.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Donation request not found' });
    }
    
    if (request.hospital.toString() !== req.hospital._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }
    
    // Update the fields
    if (urgency) request.urgency = urgency;
    if (patientCondition) request.patientCondition = patientCondition;
    if (preferredDonationDate) request.preferredDonationDate = preferredDonationDate;
    if (notes) request.notes = notes;
    if (status) request.status = status;
    
    await request.save();
    
    res.status(200).json({
      message: 'Donation request updated successfully',
      request
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all active donation requests (public)
export const getAllDonationRequests = async (req, res) => {
  try {
    const { requestType, bloodType, organ, urgency } = req.query;
    
    const query = {
      status: 'open',
      expiresAt: { $gt: new Date() }
    };
    
    if (requestType) query.requestType = requestType;
    if (bloodType && requestType === 'blood') query.bloodType = bloodType;
    if (organ && requestType === 'organ') query.organ = organ;
    if (urgency) query.urgency = urgency;
    
    const requests = await donationRequestModel.find(query)
      .populate('hospital', 'name address isVerified phone')
      .sort({ urgency: -1, createdAt: -1 });
    console.log(requests);
    
    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getDonationRequestById = async (req, res) => {
    try {
      const { requestId } = req.params;
      
      const request = await donationRequestModel.findById(requestId)
        .populate('hospital', 'name address isVerified phone')
        .populate('matchedDonors');
      
      if (!request) {
        return res.status(404).json({ message: 'Donation request not found' });
      }
      
      res.status(200).json({ request });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
// Get hospital's donation requests
export const getHospitalDonationRequests = async (req, res) => {
  try {
    const requests = await donationRequestModel.find({ 
      hospital: req.query.hospitalId
    })
    .populate('matchedDonors')
    .sort({ createdAt: -1 });
    
    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Match donors with a specific request
export const matchDonorsWithRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await donationRequestModel.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Donation request not found' });
    }
    
    console.log(request);
    
    
    const matchQuery = {
      available: true
    };
    
    if (request.requestType === 'blood') {
      matchQuery.bloodType = request.bloodType;
    } else if (request.requestType === 'organ') {
      matchQuery.organDonor = true;
      matchQuery.organs = { $in: [request.organ] };
    }
    
    console.log("log");
    
    const matchedDonors = await donorModel.find(matchQuery).populate('user', 'name email phone');
   
    if(matchedDonors.length == 0){
        return  res.status(403).json({ message: 'No Matched is found' })
    }
    // Update the request with matched donors
    request.matchedDonors = matchedDonors.map(donor => donor._id);
    request.status = 'matched';
    await request.save();
    
    res.status(200).json({
      message: 'Donors matched successfully',
      matchedDonors,
      request
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
