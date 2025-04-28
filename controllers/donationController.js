import donationModel from '../models/donationModel.js';
import donorModel from '../models/donorModel.js';
import donationRequestModel from '../models/donationRequestModel.js';

// Schedule a donation
export const scheduleDonation = async (req, res) => {
  try {
    const { 
      donorId, requestId, donationType, 
      bloodType, organ, donationDate, notes 
    } = req.body;
    
    // Verify the donor exists and is available
    const donor = await donorModel.findById(donorId);
    if (!donor || !donor.available) {
      return res.status(404).json({ 
        message: donor ? 'Donor is not available' : 'Donor not found' 
      });
    }
    
    // If there's a requestId, verify it exists and matches the hospital
    if (requestId) {
      const request = await donationRequestModel.findById(requestId);
      if (!request) {
        return res.status(404).json({ message: 'Donation request not found' });
      }
      
      if (request.hospital.toString() !== req.query.hospitalId.toString()) {
        return res.status(403).json({ 
          message: 'Not authorized to schedule donations for this request' 
        });
      }
    }
    
    // Create the donation record
    const newDonation = new donationModel({
      donor: donorId,
      request: requestId,
      hospital: req.query.hospitalId,
      donationType,
      bloodType: donationType === 'blood' ? bloodType : undefined,
      organ: donationType === 'organ' ? organ : undefined,
      donationDate,
      notes
    });
    
    await newDonation.save();
    
    // Update donor's lastDonated date and set available to false temporarily
    donor.lastDonated = donationDate;
    donor.available = false;
    await donor.save();
    
    // If there's a request, update its status
    if (requestId) {
      await donationRequestModel.findByIdAndUpdate(requestId, {
        status: 'matched'
      });
    }
    
    res.status(201).json({
      message: 'Donation scheduled successfully',
      donation: newDonation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complete a donation
export const completeDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { amount, notes } = req.body;
    
    const donation = await donationModel.findById(donationId);
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation record not found' });
    }
    
    if (donation.hospital.toString() !== req.query.hospitalId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this donation' });
    }
    
    // Update donation status and additional details
    donation.status = 'completed';
    if (amount) donation.amount = amount;
    if (notes) donation.notes += `\n${notes}`;
    
    await donation.save();
    
    // If there's a request, update its status
    if (donation.request) {
      await donationRequestModel.findByIdAndUpdate(donation.request, {
        status: 'completed'
      });
    }
    
    // Re-enable donor availability after 56 days for blood donation
    // (standard medical recommendation for blood donation frequency)
    const donor = await donorModel.findById(donation.donor);
    
    if (donation.donationType === 'blood') {
      // Schedule donor to be available again after 56 days
      setTimeout(async () => {
        donor.available = true;
        await donor.save();
      }, 56 * 24 * 60 * 60 * 1000); // 56 days in milliseconds
    } else {
      // For organ donation, the donor may never be available again for that organ
      // but could still be available for other organs or blood donations
      if (donation.organ) {
        donor.organs = donor.organs.filter(org => org !== donation.organ);
        
        // If no more organs to donate, set organDonor to false
        if (donor.organs.length === 0) {
          donor.organDonor = false;
        }
        
        await donor.save();
      }
    }
    
    res.status(200).json({
      message: 'Donation completed successfully',
      donation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel a donation
export const cancelDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { reason } = req.body;
    
    const donation = await donationModel.findById(donationId);
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation record not found' });
    }
    
    // Check if the request is from the donor or the hospital
    const isDonor = req.user && donation.donor.user && 
                    donation.donor.user.toString() === req.user._id.toString();
    const isHospital = req.hospital && 
                       donation.hospital.toString() === req.query.hospitalId.toString();
    
    if (!isDonor && !isHospital) {
      return res.status(403).json({ 
        message: 'Not authorized to cancel this donation' 
      });
    }
    
    // Update donation status and add cancellation reason
    donation.status = 'cancelled';
    donation.notes += `\nCancelled by ${isDonor ? 'donor' : 'hospital'}. Reason: ${reason || 'Not specified'}`;
    
    await donation.save();
    
    // Reset donor availability
    const donor = await donorModel.findById(donation.donor);
    if (donor) {
      donor.available = true;
      await donor.save();
    }
    
    // If there's a request and it was the only donation for that request, reset its status
    if (donation.request) {
      const otherDonations = await donationModel.countDocuments({
        request: donation.request,
        status: { $ne: 'cancelled' }
      });
      
      if (otherDonations === 0) {
        await donationRequestModel.findByIdAndUpdate(donation.request, {
          status: 'open'
        });
      }
    }
    
    res.status(200).json({
      message: 'Donation cancelled successfully',
      donation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get donor's donations
export const getDonorDonations = async (req, res) => {
  try {
    const donor = await donorModel.findOne({ user: req.user._id });
    
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }
    
    const donations = await donationModel.find({ donor: donor._id })
      .populate('hospital', 'name address phone')
      .populate('request')
      .sort({ donationDate: -1 });
    
    res.status(200).json({ donations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get hospital's donations
export const getHospitalDonations = async (req, res) => {
  try {
    const donations = await donationModel.find({ hospital: req.query.hospitalId })
      .populate({
        path: 'donor',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      })
      .populate('request')
      .sort({ donationDate: -1 });
    
    res.status(200).json({ donations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
