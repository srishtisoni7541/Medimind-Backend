import express from 'express'
import { bookAppointment, cancelAppointment, getProfile, listAppointment, loginUser, paymentRazorpay, registerUser, updateProfile, verifyRazorpay, getuser,savedDoctor,savedHospital} from '../controllers/userController.js'
import {getDoctorById,getDoctors,searchDoctors} from '../controllers/doctorController.js'

import authUser from '../middlewares/authUser.js'
import upload from '../middlewares/multer.js'
import { 
  getHospitals,
  addHospital,
  updateHospital,
  getHospitalById,
  searchHospitals,
  deleteHospital
} from '../controllers/hospitalController.js';

const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.get('/get-profile', authUser, getProfile)
userRouter.post('/update-profile', upload.single('image'), authUser, updateProfile)
userRouter.post('/book-appointment', authUser, bookAppointment)
userRouter.get('/appointments', authUser, listAppointment)
userRouter.post('/cancel-appointment', authUser, cancelAppointment)
userRouter.post('/payment-razorpay', authUser, paymentRazorpay)
userRouter.post('/verifyRazorpay', authUser, verifyRazorpay)

userRouter.get("/", authUser,getuser);
userRouter.get(
  "/:doctorId",
  authUser,
 savedDoctor
);

userRouter.get(
  "/:hospitalId",
  authUser,
 savedHospital
);
userRouter.get('/get-hospital', authUser, getHospitals);
userRouter.get('/get-hospital/:hospitalId', getHospitalById);
userRouter.get('/find-hospitals', searchHospitals);
userRouter.get('/delete/:id', authUser, deleteHospital);
userRouter.get('/get-doctor',authUser,getDoctors);
userRouter.get('/get-doctor/:doctorId',getDoctorById);
userRouter.get('/find-doctor',searchDoctors);
export default userRouter