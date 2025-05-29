import express from 'express'
import { bookAppointment, cancelAppointment, getProfile, listAppointment, loginUser, paymentRazorpay, registerUser, updateProfile, verifyRazorpay, getuser,savedDoctor,savedHospital, googleAuth} from '../controllers/userController.js'
import {getDoctorById,getDoctors,searchDoctors} from '../controllers/doctorController.js'
import { getAllPrescriptions,getPrescriptionById } from '../controllers/doctorController.js'
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

userRouter.post('/user/register', registerUser)
userRouter.post('/user/google-auth',googleAuth)
userRouter.post('/user/login', loginUser)
userRouter.get('/user/get-profile', authUser, getProfile)
userRouter.post('/user/update-profile', upload.single('image'), authUser, updateProfile)
userRouter.post('/user/book-appointment', authUser, bookAppointment)
userRouter.get('/user/appointments', authUser, listAppointment)
userRouter.post('/user/cancel-appointment', authUser, cancelAppointment)
userRouter.post('/user/payment-razorpay', authUser, paymentRazorpay)
userRouter.post('/user/verifyRazorpay', authUser, verifyRazorpay)

userRouter.get("/user/user", authUser,getuser);
userRouter.get(
  "/save/:doctorId",
  authUser,
 savedDoctor
);
// userRouter.get(
//   "/:hospitalId",
//   authUser,
//  savedHospital
// );
userRouter.get('/user/get-hospital', authUser, getHospitals);
userRouter.get('/user/get-hospital/:hospitalId', getHospitalById);
userRouter.get('/user/find-hospitals', searchHospitals);
// userRouter.get('/user/delete/:id', authUser, deleteHospital);
userRouter.get('/user/get-doctor',authUser,getDoctors);
userRouter.get('/user/get-doctor/:doctorId',getDoctorById);
userRouter.get('/user/find-doctor',searchDoctors);

userRouter.get('/user/prescriptions', authUser, getAllPrescriptions);
userRouter.get('/user/prescriptions/:id', authUser, getPrescriptionById);
export default userRouter