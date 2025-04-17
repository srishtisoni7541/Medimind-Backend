import { StatusCodes } from "http-status-codes";
import Doctor from "../models/doctorModel.js";
import Hospital from "../models/hospital.js";
import User from "../models/userModel.js";
import HospitalReview from "../models/hospitalReview.js";

// Search hospitals with filters
export const searchHospitals = async (req, res) => {
    console.log("here working");
    
  try {
    const {
      specialties,
      rating,
      providesUrgentCare,
      name,
    } = req.query;
    
    let query = {};
    
    if (specialties) {
      query.specialties = { $in: specialties.split(',') };
    }
    
    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }
    
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }
    
    if (providesUrgentCare) {
      query.providesUrgentCare = providesUrgentCare === "true";
    }
    
    const hospitals = await Hospital.find(query).populate("reviews");
    res.json({ success: true, hospitals });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getHospitalById = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const hospital = await Hospital.findById(hospitalId).populate("reviews").populate("doctors");
    
    if (!hospital) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        success: false, 
        message: "Hospital not found" 
      });
    }
    
    // Add emergency contact details to the response
    const response = {
      ...hospital.toObject(),
      emergencyContact: hospital.emergencyContact,
    };
    
    res.status(StatusCodes.OK).json({ success: true, hospital: response });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getHospitals = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    const hospitals = await Hospital.find({ user: user._id }).populate("reviews");
    res.json({ success: true, hospitals });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const addHospital = async (req, res) => {
  try {
    const {
      name,
      specialties,
      phone,
      address,
      operatingHours,
      providesUrgentCare,
      hospitalType
    } = req.body;
    
    const HospitalExists = await Hospital.findOne({ name, phone });
    
    if (HospitalExists) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        success: false, 
        message: "Hospital already exists" 
      });
    }
    
   
    
    const newHospital = new Hospital({
      name,
      specialties,
      phone,
      address,
      hospitalType,
      operatingHours,
      providesUrgentCare,
    });
    
    await newHospital.save();
    
    res.status(StatusCodes.CREATED).json({ success: true, hospital: newHospital });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const updateHospital = async (req, res) => {
  try {
    const hospitalId = req.params.id;
    const {
      name,
      specialties,
      phone,
      address,
      operatingHours,
      providesUrgentCare,
      hospitalType
    } = req.body;
    
    // Find the hospital
    const hospital = await Hospital.findById(hospitalId);
    
    if (!hospital) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        success: false, 
        message: "Hospital not found" 
      });
    }
    
   
    
    // Check if updated name+phone combination already exists for another hospital
    if (name !== hospital.name || phone !== hospital.phone) {
      const hospitalExists = await Hospital.findOne({
        name,
        phone,
        _id: { $ne: hospitalId } // exclude current hospital from check
      });
      
      if (hospitalExists) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          success: false, 
          message: "Hospital with this name and phone already exists" 
        });
      }
    }
    
    // Update hospital
    const updatedHospital = await Hospital.findByIdAndUpdate(
      hospitalId,
      {
        name,
        specialties,
        phone,
        address,
        hospitalType,
        operatingHours,
        providesUrgentCare,
      },
      { new: true, runValidators: true }
    );
    
    res.status(StatusCodes.OK).json({ success: true, hospital: updatedHospital });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const deleteHospital = async (req, res) => {
  try {
    const hospitalId = req.params.id;
    
    // Find the hospital
    const hospital = await Hospital.findById(hospitalId);
    
    if (!hospital) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        success: false, 
        message: "Hospital not found" 
      });
    }
    
    // Check if user has permission to delete
    if (hospital.user.toString() !== req.user._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        success: false, 
        message: "You don't have permission to delete this hospital" 
      });
    }
    
    // Check if hospital has doctors associated with it
    if (hospital.doctors && hospital.doctors.length > 0) {
      // Delete all associated doctors as well
      await Doctor.deleteMany({ hospital: hospitalId });
    }
    
    // Delete associated reviews if any
    if (hospital.reviews && hospital.reviews.length > 0) {
      await HospitalReview.deleteMany({ hospital: hospitalId });
    }
    
    // Delete the hospital
    await Hospital.findByIdAndDelete(hospitalId);
    
    res.status(StatusCodes.OK).json({ 
      success: true, 
      message: "Hospital deleted successfully" 
    });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      success: false, 
      message: error.message 
    });
  }
};
