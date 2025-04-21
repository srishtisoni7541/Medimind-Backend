import express from 'express'
import { appointmentCancel,
     appointmentComplete, appointmentsDoctor,
      doctorDashboard, doctorList, loginDoctor,
       doctorProfile, updateDoctorProfile,
       createPrescription,
       getPrescriptionByAppointment,
       updatePrescription,
       getDoctorPrescriptions
     } from '../controllers/doctorController.js'
import authDoctor from '../middlewares/authDoctor.js'

const doctorRouter = express.Router()

doctorRouter.get('/list', doctorList)
doctorRouter.post('/login', loginDoctor)
doctorRouter.get('/appointments', authDoctor, appointmentsDoctor)
doctorRouter.post('/complete-appointment', authDoctor, appointmentComplete)
doctorRouter.post('/cancel-appointment', authDoctor, appointmentCancel)
doctorRouter.get('/dashboard', authDoctor, doctorDashboard)
doctorRouter.get('/profile', authDoctor, doctorProfile)
doctorRouter.post('/update-profile', authDoctor, updateDoctorProfile)

doctorRouter.post('/prescriptions', authDoctor, createPrescription)
doctorRouter.get('/prescriptions/appointment/:appointmentId', authDoctor, getPrescriptionByAppointment)
doctorRouter.get('/prescriptions/:prescriptionId', authDoctor, updatePrescription)
doctorRouter.put('/prescriptions/:prescriptionId', authDoctor, updatePrescription)
doctorRouter.get('/prescriptions/doctor/:doctorId', authDoctor, getDoctorPrescriptions)
export default doctorRouter