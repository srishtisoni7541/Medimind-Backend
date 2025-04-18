import validator from 'validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import razorpay from 'razorpay'
// import Doctor from "../models/doctorModel.js"
import Hospital from "../models/hospital.js"
import HospitalReview from "../models/hospitalReview.js"
import DoctorReview from "../models/doctorReview.js"


const registerUser = async (req, res) => {
      try {
            const { name, email, password } = req.body
            if (!name || !email || !password) {
                  return res.json({ success: false, meassage: "Missing Details" })
            }
            if (!validator.isEmail(email)) {
                  return res.json({ success: false, meassage: "Enter a valid email" })
            }
            if (password.length < 8) {
                  return res.json({ success: false, meassage: "Password should be of 8 characters" })
            }

            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)

            const userData = {
                  name,
                  email,
                  password: hashedPassword
            }

            const newUser = new userModel(userData)
            const user = await newUser.save()
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
      } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const loginUser = async (req, res) => {
      try {
            const { email, password } = req.body
            const user = await userModel.findOne({ email })

            if (!user) {
                  return res.json({ success: false, message: "User does not exists" })
            }

            const isMatch = await bcrypt.compare(password, user.password)

            if (isMatch) {
                  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
                  res.json({ success: true, token })
            }
            else {
                  res.json({ success: false, message: "Invalid Credentials" })
            }

      } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const getProfile = async (req, res) => {
      try {
            const { userId } = req.body
            const userData = await userModel.findById(userId).select('-password');
            res.json({ success: true, userData })
      } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const updateProfile = async (req, res) => {
      try {
            const { userId, name, phone, address, dob, gender } = req.body
            const imageFile = req.file

            if (!name || !phone || !dob || !gender) {
                  return res.json({ success: false, message: "Data Missing" })
            }

            await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

            if (imageFile) {
                  const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' })
                  const imageURL = imageUpload.secure_url

                  await userModel.findByIdAndUpdate(userId, { image: imageURL })
            }
            res.json({ success: true, message: "Profile Updated" })
      } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}
// Get user profile with all relations
const getuser = async (req, res) => {
      try {
        const userData = await userModel.findById(req.user._id)
          .populate({
            path: 'hosreviews',
            populate: {
              path: 'hospital',
              model: 'Hospital'
            }
          })
          .populate({
            path: 'docreviews',
            populate: {
              path: 'doctor',
              model: 'doctor'
            }
          })
          .populate('savedHospitals')
          .populate('savedDoctors');
    
        if (!userData) {
          return res.status(404).json({ success: false, message: "User not found" });
        }
    
        res.json({
          success: true,
          message: "User data fetched successfully",
          data: userData
        });
      } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
      }
    };
    
    // Toggle save/unsave for doctor
    const savedDoctor = async (req, res) => {
      try {
        const userData = await userModel.findById(req.user._id);
        if (!userData) {
          return res.status(404).json({ success: false, message: "User not found" });
        }
    
        const doctor = await doctorModel.findById(req.params.doctorId);
        if (!doctor) {
          return res.status(404).json({ success: false, message: "Doctor not found" });
        }
    
        const doctorIndex = userData.savedDoctors.indexOf(doctor._id);
        if (doctorIndex === -1) {
          userData.savedDoctors.push(doctor._id);
          await userData.save();
          return res.json({ success: true, message: "Doctor saved successfully" });
        } else {
          userData.savedDoctors.splice(doctorIndex, 1);
          await userData.save();
          return res.json({ success: true, message: "Doctor unsaved successfully" });
        }
      } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
      }
    };
    
    // Toggle save/unsave for hospital
    const savedHospital = async (req, res) => {
      try {
        const userData = await userModel.findById(req.user._id);
        if (!userData) {
          return res.status(404).json({ success: false, message: "User not found" });
        }
    
        const hospital = await Hospital.findById(req.params.hospitalId);
        if (!hospital) {
          return res.status(404).json({ success: false, message: "Hospital not found" });
        }
    
        const hospitalIndex = userData.savedHospitals.indexOf(hospital._id);
        if (hospitalIndex === -1) {
          userData.savedHospitals.push(hospital._id);
        } else {
          userData.savedHospitals.splice(hospitalIndex, 1);
        }
    
        await userData.save();
        res.json({ success: true, message: "Hospital save status toggled successfully" });
      } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
      }
    };
    

const bookAppointment = async (req, res) => {
      try {
            const { userId, docId, slotDate, slotTime } = req.body
            const docData = await doctorModel.findById(docId).select('-password')

            if (!docData.available) {
                  return res.json({ success: false, message: "Doctor not available" })
            }

            let slots_booked = docData.slots_booked
            if (slots_booked[slotDate]) {
                  if (slots_booked[slotDate].includes(slotTime)) {
                        return res.json({ success: false, message: "Slot not available" })
                  } else {
                        slots_booked[slotDate].push(slotTime)
                  }
            } else {
                  slots_booked[slotDate] = []
                  slots_booked[slotDate].push(slotTime)
            }

            const userData = await userModel.findById(userId).select('-password');
            delete docData.slots_booked

            const appointmentData = {
                  userId,
                  docId,
                  userData,
                  docData,
                  amount: docData.fees,
                  slotTime,
                  slotDate,
                  date: Date.now()
            }

            const newAppointment = new appointmentModel(appointmentData)
            await newAppointment.save()
            await doctorModel.findByIdAndUpdate(docId, { slots_booked })
            res.json({ success: true, message: "Appointment Booked" })
      } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const listAppointment = async (req, res) => {
      try {
            const { userId } = req.body
            const appointments = await appointmentModel.find({ userId })
            res.json({ success: true, appointments })
      } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message })
      }
}

const cancelAppointment = async (req, res) => {
      try {
            const { userId, appointmentId } = req.body;
            const appointmentData = await appointmentModel.findById(appointmentId);
            if (appointmentData.userId.toString() !== userId) {
                  return res.json({ success: false, message: "Unauthorized action" });
            }
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
            const { docId, slotDate, slotTime } = appointmentData;
            const doctorData = await doctorModel.findById(docId);

            let slots_booked = doctorData.slots_booked;
            if (slots_booked[slotDate]) {
                  slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
                  if (slots_booked[slotDate].length === 0) {
                        delete slots_booked[slotDate];
                  }
            }

            await doctorModel.findByIdAndUpdate(docId, { slots_booked });
            res.json({ success: true, message: "Appointment Cancelled" });
      } catch (error) {
            console.log(error);
            res.json({ success: false, message: error.message });
      }
};

const razorpayInstance = new razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
})

const paymentRazorpay = async (req, res) => {
      try {
            const { appointmentId } = req.body
            const appointmentData = await appointmentModel.findById(appointmentId)

            if (!appointmentData || appointmentData.cancelled) {
                  return res.json({ success: true, message: "Appointment cancelled or not found." })
            }

            const options = {
                  amount: appointmentData.amount * 100,
                  currency: process.env.CURRENCY,
                  receipt: appointmentId,
            }

            const order = await razorpayInstance.orders.create(options)
            res.json({ success: true, order })
      } catch (error) {
            console.log(error);
            res.json({ success: false, message: error.message });
      }
}

const verifyRazorpay = async (req, res) => {
      try {
            const { razorpay_order_id } = req.body
            const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

            if (orderInfo.status === 'paid') {
                  await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true })
                  res.json({ success: true, message: "Payment Successful" })
            } else {
                  res.json({ success: false, message: "Payment failed" })
            }
      } catch (error) {
            console.log(error);
            res.json({ success: false, message: error.message });
      }
}

export {
      registerUser,
      loginUser,
      getProfile,
      updateProfile,
      bookAppointment,
      listAppointment,
      cancelAppointment,
      paymentRazorpay,
      verifyRazorpay,
      getuser,
      savedDoctor,
      savedHospital
}