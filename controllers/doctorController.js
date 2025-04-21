import doctorModel from '../models/doctorModel.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'
import prescriptionModel from '../models/prescription.js'
import Hospital from '../models/hospital.js';
import User from '../models/userModel.js';

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



const changeAvailability = async (req, res) => {
      try {
            const { docId } = req.body
            const docData = await doctorModel.findById(docId)
            await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
            res.json({ success: true, message: 'Availability Changed' })
      } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const doctorList = async (req, res) => {
      try {
            const doctors = await doctorModel.find({}).select(['-password', '-email'])
            res.json({ success: true, doctors })
      } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const loginDoctor = async (req, res) => {
      try {
            const { email, password } = req.body
            const doctor = await doctorModel.findOne({ email })

            if (!doctor) {
                  return res.json({ success: true, message: "Invalid Credentials" })
            }

            const isMatch = await bcrypt.compare(password, doctor.password)

            if (isMatch) {
                  const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET)
                  res.json({ success: true, token })
            } else {
                  res.json({ success: false, message: "Invalid credentials" })
            }
      } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const appointmentsDoctor = async (req, res) => {
      try {
            const { docId } = req.body
            const appointments = await appointmentModel.find({ docId })
            res.json({ success: true, appointments })
      }
      catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const appointmentComplete = async (req, res) => {
      try {
            const { docId, appointmentId } = req.body
            const appointmentData = await appointmentModel.findById(appointmentId)

            if (appointmentData && appointmentData.docId === docId) {
                  await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
                  return res.json({ success: true, message: "Appointment Completed" })
            } else {
                  return res.json({ success: false, message: "Mark failed" })
            }
      } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const appointmentCancel = async (req, res) => {
      try {
            const { docId, appointmentId } = req.body
            const appointmentData = await appointmentModel.findById(appointmentId)

            if (appointmentData && appointmentData.docId === docId) {
                  await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
                  return res.json({ success: true, message: "Appointment Cancelled" })
            } else {
                  return res.json({ success: false, message: "Cancellation failed" })
            }
      } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const doctorDashboard = async (req, res) => {
      try {
            const { docId } = req.body
            const appointments = await appointmentModel.find({ docId })

            let earnings = 0
            appointments.map((item) => {
                  if (item.isCompleted || item.payment) {
                        earnings += item.amount
                  }
            })

            let patients = []
            appointments.map((item) => {
                  if (!patients.includes(item.userId)) {
                        patients.push(item.userId)
                  }
            })

            const dashData = {
                  earnings,
                  appointments: appointments.length,
                  patients: patients.length,
                  latestAppointments: appointments.reverse().slice(0, 5)
            }
            res.json({ success: true, dashData })
      }
      catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const doctorProfile = async (req, res) => {
      try {
            const { docId } = req.body
            const profileData = await doctorModel.findById(docId).select('-password')
            res.json({ success: true, profileData })
      } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const updateDoctorProfile = async (req, res) => {
      try {
            const { docId, fees, address, available } = req.body
            await doctorModel.findByIdAndUpdate(docId, { fees, address, available })
            res.json({ success: true, message: "Profile Updated" })
      }
      catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}


export const createPrescription = async (req, res) => {
      try {
        const { 
          appointmentId, 
          doctorId, 
          patientId, 
          medications, 
          diagnosis, 
          notes 
        } = req.body
        
        // Verify appointment exists and belongs to this doctor
        const appointment = await appointmentModel.findById(appointmentId)
        
        if (!appointment) {
          return res.status(404).json({ 
            success: false, 
            message: "Appointment not found" 
          })
        }
        
        if (appointment.docId.toString() !== doctorId.toString()) {
          return res.status(403).json({ 
            success: false, 
            message: "Not authorized to create prescription for this appointment" 
          })
        }
        
        // Check if appointment is completed
        if (!appointment.isCompleted) {
          return res.status(400).json({ 
            success: false, 
            message: "Cannot create prescription for incomplete appointment" 
          })
        }
        
        // Check if prescription already exists
        const existingPrescription = await prescriptionModel.findOne({ appointmentId })
        if (existingPrescription) {
          return res.status(400).json({ 
            success: false, 
            message: "Prescription already exists for this appointment" 
          })
        }
        
        // Create new prescription
        const newPrescription = new prescriptionModel({
          appointmentId,
          doctorId,
          patientId,
          medications,
          diagnosis,
          notes
        })
        
        await newPrescription.save()
        
        res.status(201).json({ 
          success: true, 
          message: "Prescription created successfully",
          data: newPrescription
        })
        
      } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
      }
    }
    
    // Get prescription by appointment ID
    export const getPrescriptionByAppointment = async (req, res) => {
      try {
        const { appointmentId } = req.params
        
        const prescription = await prescriptionModel.findOne({ appointmentId })
          .populate('doctorId', 'name speciality')
          .populate('patientId', 'name email')
        
        if (!prescription) {
          return res.status(404).json({ 
            success: false, 
            message: "Prescription not found" 
          })
        }
        
        res.status(200).json({ 
          success: true, 
          data: prescription 
        })
        
      } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
      }
    }
    
    // Update existing prescription
    export const updatePrescription = async (req, res) => {
      try {
        const { prescriptionId } = req.params
        const { 
          medications, 
          diagnosis, 
          notes 
        } = req.body
        
        const prescription = await prescriptionModel.findById(prescriptionId)
        
        if (!prescription) {
          return res.status(404).json({ 
            success: false, 
            message: "Prescription not found" 
          })
        }
        
      
        // Update prescription
        prescription.medications = medications || prescription.medications
        prescription.diagnosis = diagnosis || prescription.diagnosis
        prescription.notes = notes || prescription.notes
        prescription.updatedAt = Date.now()
        
        await prescription.save()
        
        res.status(200).json({ 
          success: true, 
          message: "Prescription updated successfully",
          data: prescription
        })
        
      } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
      }
    }
    
    // Get all prescriptions for a patient
    export const getPatientPrescriptions = async (req, res) => {
      try {
        const { patientId } = req.params
        
        const prescriptions = await prescriptionModel.find({ patientId })
          .populate('doctorId', 'name speciality')
          .populate('appointmentId')
          .sort({ createdAt: -1 })
        
        res.status(200).json({ 
          success: true, 
          data: prescriptions 
        })
        
      } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
      }
    }
    
    // Get all prescriptions created by a doctor
    export const getDoctorPrescriptions = async (req, res) => {
      try {
        const { doctorId } = req.params
        
        const prescriptions = await prescriptionModel.find({ doctorId })
          .populate('patientId', 'name email')
          .populate('appointmentId')
          .sort({ createdAt: -1 })
        
        res.status(200).json({ 
          success: true, 
          data: prescriptions 
        })
        
      } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
      }
    }

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