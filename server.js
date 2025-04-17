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
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

app.use(express.json())
app.use(cors())

app.use('/api/admin', adminRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/user', userRouter)
app.use('/api/doctor-reviews', doctorReview)
app.use('/api/hospital-reviews',HospitalReview)

app.get('/', (req, res) => {
      res.send('API WORKING')
})

app.listen(port, () => console.log("Server Started", port))