import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoutes.js'
import doctorRouter from './routes/doctorRoutes.js'
import userRouter from './routes/userRoute.js'
import doctorReview from './routes/doctorReviewRoutes.js'
import HospitalReview from './routes/hospitalReviewRoutes.js'
import  medicalRoutes from './routes/medicalRoutes.js'
import medicationRoutes from './routes/medicationRoutes.js'
import dietRoutes from './routes/dietRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import journalRoutes from './routes/journal.js';
import analysisRoutes from './routes/analysis.js';
import helmet  from 'helmet'
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

app.use(express.json())

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://medimind-azure.vercel.app',    
  'https://medimind-admin.vercel.app',
  'https://medimind-frontend.vercel.app',
  'https://medimind-admin-three.vercel.app' 
];
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like curl or mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


app.use(helmet());


app.use('/api/admin', adminRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api', userRouter)
app.use('/api/doctor-reviews', doctorReview)
app.use('/api/hospital-reviews',HospitalReview)
app.use('/api', medicalRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api', dietRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/analysis', analysisRoutes);
app.get('/', (req, res) => {
      res.send('API WORKING')
})

app.listen(port, () => console.log("Server Started", port))