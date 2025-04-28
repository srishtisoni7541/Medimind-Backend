import doctorModel from '../models/doctorModel.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'
import prescriptionModel from '../models/prescription.js'
import Hospital from '../models/hospital.js';
import User from '../models/userModel.js';
// Add mongoose import for transactions
import mongoose from 'mongoose';

export const getDoctors = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const doctors = await doctorModel.find({ user: user._id })
      .populate("reviews")
      .populate("hospital");

    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await doctorModel.findById(doctorId).populate("reviews").populate("hospital");

    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchDoctors = async (req, res) => {
      
  try {
    const { specialty, rating, providesUrgentCare, name, hospital } = req.query;
    let query = {};

    if (specialty) query.specialty = specialty;
    if (rating) query.rating = { $gte: parseFloat(rating) };
    if (providesUrgentCare) query.providesUrgentCare = providesUrgentCare === "true";
    if (name) query.name = { $regex: name, $options: "i" };

    if (hospital) {
      const hospitalData = await Hospital.findOne({ name: { $regex: hospital, $options: "i" } });
      if (hospitalData) {
        query.hospital = hospitalData._id;
      } else {
        return res.status(404).json({ success: false, message: "Hospital not found" });
      }
    }

    const doctors = await doctorModel.find(query).populate("reviews").populate("hospital");
    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Updated with concurrency control
const changeAvailability = async (req, res) => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();
      
  try {
    const { docId } = req.body;
    // Use session to lock the document during the read
    const docData = await doctorModel.findById(docId).session(session);
    
    if (!docData) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    
    // If changing to unavailable, check for pending appointments
    if (docData.available === true) {
      const pendingAppointments = await appointmentModel.countDocuments({
        docId,
        isCompleted: false,
        isCancelled: { $ne: true },
        date: { $gte: new Date() }
      }).session(session);
      
      if (pendingAppointments > 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: "Cannot change availability: you have pending appointments" 
        });
      }
    }
    
    await doctorModel.findByIdAndUpdate(docId, { available: !docData.available }, { session });
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    res.json({ success: true, message: 'Availability Changed' });
  } catch (error) {
    // If any error, abort the transaction
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(['-password', '-email']);
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await doctorModel.findOne({ email });

    if (!doctor) {
      return res.json({ success: true, message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);

    if (isMatch) {
      const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

const appointmentsDoctor = async (req, res) => {
  try {
    const { docId } = req.body;
    const appointments = await appointmentModel.find({ docId });
    res.json({ success: true, appointments });
  }
  catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

// Updated with concurrency control
const appointmentComplete = async (req, res) => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();
      
  try {
    const { docId, appointmentId } = req.body;
    // Use session to lock the document during read
    const appointmentData = await appointmentModel.findById(appointmentId).session(session);

    if (!appointmentData) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    
    // Verify ownership
    if (appointmentData.docId.toString() !== docId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: "Not authorized for this appointment" });
    }
    
    // Check if already completed
    if (appointmentData.isCompleted) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Appointment already completed" });
    }
    
    // Check if canceled
    if (appointmentData.isCancelled) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Cannot complete a cancelled appointment" });
    }
    
    // Update with session to maintain lock
    await appointmentModel.findByIdAndUpdate(appointmentId, { 
      isCompleted: true,
      completedAt: new Date()
    }, { session });
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    return res.json({ success: true, message: "Appointment Completed" });
  } catch (error) {
    // If any error, abort the transaction
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

// Updated with concurrency control
const appointmentCancel = async (req, res) => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { docId, appointmentId } = req.body;
    // Use session to lock the document during read
    const appointmentData = await appointmentModel.findById(appointmentId).session(session);

    if (!appointmentData) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    
    // Verify ownership
    if (appointmentData.docId.toString() !== docId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: "Not authorized for this appointment" });
    }
    
    // Check if already completed
    if (appointmentData.isCompleted) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Cannot cancel a completed appointment" });
    }
    
    // Check if already cancelled
    if (appointmentData.isCancelled) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Appointment already cancelled" });
    }
    
    // Update with session to maintain lock
    await appointmentModel.findByIdAndUpdate(appointmentId, { 
      isCancelled: true,
      cancelledAt: new Date(),
      cancellationReason: "Cancelled by doctor"
    }, { session });
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    return res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    // If any error, abort the transaction
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

const doctorDashboard = async (req, res) => {
  try {
    const { docId } = req.body;
    const appointments = await appointmentModel.find({ docId });

    let earnings = 0;
    appointments.map((item) => {
      if (item.isCompleted || item.payment) {
        earnings += item.amount;
      }
    });

    let patients = [];
    appointments.map((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse().slice(0, 5)
    };
    res.json({ success: true, dashData });
  }
  catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

const doctorProfile = async (req, res) => {
  try {
    const { docId } = req.body;
    const profileData = await doctorModel.findById(docId).select('-password');
    res.json({ success: true, profileData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

// Updated with concurrency control
const updateDoctorProfile = async (req, res) => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();
      
  try {
    const { docId, fees, address, available } = req.body;
    
    // Find the doctor first to verify and lock
    const doctor = await doctorModel.findById(docId).session(session);
    
    if (!doctor) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    
    // If changing from available to unavailable, check for pending appointments
    if (doctor.available === true && available === false) {
      const pendingAppointments = await appointmentModel.countDocuments({
        docId,
        isCompleted: false,
        isCancelled: { $ne: true },
        date: { $gte: new Date() }
      }).session(session);
      
      if (pendingAppointments > 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: "Cannot change availability: you have pending appointments" 
        });
      }
    }
    
    // Update with session to maintain lock
    await doctorModel.findByIdAndUpdate(docId, { fees, address, available }, { session });
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    res.json({ success: true, message: "Profile Updated" });
  }
  catch (error) {
    // If any error, abort the transaction
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

// Updated with concurrency control
export const createPrescription = async (req, res) => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();
      
  try {
    const { 
      appointmentId, 
      doctorId, 
      patientId, 
      medications, 
      diagnosis, 
      notes 
    } = req.body;
    
    // Verify appointment exists and belongs to this doctor - with session for locking
    const appointment = await appointmentModel.findById(appointmentId).session(session);
    
    if (!appointment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: "Appointment not found" 
      });
    }
    
    if (appointment.docId.toString() !== doctorId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to create prescription for this appointment" 
      });
    }
    
    // Check if appointment is completed
    if (!appointment.isCompleted) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: "Cannot create prescription for incomplete appointment" 
      });
    }
    
    // Check if prescription already exists - with session to maintain lock
    const existingPrescription = await prescriptionModel.findOne({ appointmentId }).session(session);
    if (existingPrescription) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: "Prescription already exists for this appointment" 
      });
    }
    
    // Create new prescription
    const newPrescription = new prescriptionModel({
      appointmentId,
      doctorId,
      patientId,
      medications,
      diagnosis,
      notes
    });
    
    // Save with session to maintain lock
    await newPrescription.save({ session });
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({ 
      success: true, 
      message: "Prescription created successfully",
      data: newPrescription
    });
    
  } catch (error) {
    // If any error, abort the transaction
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get prescription by appointment ID
export const getPrescriptionByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const prescription = await prescriptionModel.findOne({ appointmentId })
      .populate('doctorId', 'name speciality')
      .populate('patientId', 'name email');
    
    if (!prescription) {
      return res.status(404).json({ 
        success: false, 
        message: "Prescription not found" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: prescription 
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Updated with concurrency control
export const updatePrescription = async (req, res) => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();
      
  try {
    const { prescriptionId } = req.params;
    const { 
      medications, 
      diagnosis, 
      notes 
    } = req.body;
    
    // Find prescription with session to lock it
    const prescription = await prescriptionModel.findById(prescriptionId).session(session);
    
    if (!prescription) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: "Prescription not found" 
      });
    }
    
    // For security, verify the doctor is authorized to update this prescription
    if (req.body.doctorId && prescription.doctorId.toString() !== req.body.doctorId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this prescription"
      });
    }
    
    // Update prescription fields
    prescription.medications = medications || prescription.medications;
    prescription.diagnosis = diagnosis || prescription.diagnosis;
    prescription.notes = notes || prescription.notes;
    prescription.updatedAt = Date.now();
    
    // Save with session to maintain lock
    await prescription.save({ session });
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({ 
      success: true, 
      message: "Prescription updated successfully",
      data: prescription
    });
    
  } catch (error) {
    // If any error, abort the transaction
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get all prescriptions created by a doctor
export const getDoctorPrescriptions = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const prescriptions = await prescriptionModel.find({ doctorId })
      .populate('patientId', 'name email')
      .populate('appointmentId')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      data: prescriptions 
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export const getAllPrescriptions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const prescriptions = await prescriptionModel.find({ patientId: userId })
      .populate('doctorId', 'firstName lastName specialization')
      .populate('appointmentId', 'date time')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      prescriptions
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions',
      error: error.message
    });
  }
};

// Get a specific prescription by ID
export const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const prescription = await prescriptionModel.findById(id)
      .populate('doctorId', 'firstName lastName specialization profileImage')
      .populate('appointmentId', 'date time');
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    // Ensure user can only view their own prescriptions
    if (prescription.patientId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this prescription'
      });
    }
    
    res.status(200).json({
      success: true,
      prescription
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription',
      error: error.message
    });
  }
};

export {
  changeAvailability,
  doctorList,
  loginDoctor,
  appointmentsDoctor,
  appointmentComplete,
  appointmentCancel,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
}