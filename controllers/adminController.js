import validator from 'validator'
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'
import userModel from '../models/userModel.js'
import Hospital from '../models/hospital.js'
const addDoctor = async (req, res) => {
      try {
            const { name, email, password, speciality, degree, experience, about, fees, address, hospitalId } = req.body
            const imageFile = req.file

            if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address || !hospitalId) {
                  return res.json({ success: false, message: "Missing Details" })
            }

            if (!imageFile) {
                  return res.json({ success: false, message: "Image file is required" });
            }

            if (!validator.isEmail(email)) {
                  return res.json({ success: false, message: "Please enter a valid email" })
            }

            if (password.length < 8) {
                  return res.json({ success: false, message: "Password should be of 8 character" })
            }

            // Check if hospital exists
            const hospital = await Hospital.findById(hospitalId);
            if (!hospital) {
                  return res.json({ success: false, message: "Hospital not found" });
            }

            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            const imageUrl = imageUpload.secure_url

            const doctorData = {
                  name,
                  email,
                  image: imageUrl,
                  password: hashedPassword,
                  speciality,
                  degree,
                  experience,
                  about,
                  fees,
                  address: address,
                  hospital: hospitalId, // Associate doctor with hospital
                  date: Date.now()
            }

            const newDoctor = new doctorModel(doctorData)
            const savedDoctor = await newDoctor.save()

            // Add doctor to hospital's doctors array
            hospital.doctors.push(savedDoctor._id);
            await hospital.save();

            res.json({ success: true, message: "Doctor Added" })
      } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const loginAdmin = async (req, res) => {
      try {
            const { email, password } = req.body;

            if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {

                  const token = jwt.sign({ email }, process.env.JWT_SECRET)
                  res.json({ success: true, token })
            } else {
                  res.json({ success: false, message: "Invalid Credentials" });
            }
      } catch (error) {
            console.error(error);
            res.json({ success: false, message: error.message });
      }
}

const allDoctors = async (req, res) => {
      try {
            const doctors = await doctorModel.find({}).select('-password')
            res.json({ success: true, doctors })

      } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const appointmentsAdmin = async (req, res) => {
      try {
            const appointments = await appointmentModel.find({})
            res.json({ success: true, appointments })
      } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const appointmentCancel = async (req, res) => {
      try {
            const { appointmentId } = req.body;

            const appointmentData = await appointmentModel.findById(appointmentId);
            if (!appointmentData) {
                  return res.json({ success: false, message: "Appointment not found" });
            }

            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

            const { docId, slotDate, slotTime } = appointmentData;

            const doctorData = await doctorModel.findById(docId);
            if (!doctorData) {
                  return res.json({ success: false, message: "Doctor not found" });
            }

            let slots_booked = doctorData.slots_booked;
            slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);

            await doctorModel.findByIdAndUpdate(docId, { slots_booked });

            res.json({ success: true, message: "Appointment Cancelled" });
      } catch (error) {
            console.log(error);
            res.json({ success: false, message: error.message });
      }
};

const adminDashboard = async (req, res) => {
      try {
            const doctors = await userModel.find({})
            const users = await userModel.find({})
            const appointments = await appointmentModel.find({})

            const dashData = {
                  doctors: doctors.length,
                  appointments: appointments.length,
                  patients: users.length,
                  latestAppointments: appointments.reverse().slice(0, 5)
            }
            res.json({ success: true, dashData })

      }
      catch (error) {
            console.log(error);
            res.json({ success: false, message: error.message });
      }
}

export {
      addDoctor,
      loginAdmin,
      allDoctors,
      appointmentsAdmin,
      appointmentCancel,
      adminDashboard
}