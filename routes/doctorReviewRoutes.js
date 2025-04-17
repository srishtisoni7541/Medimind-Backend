import express from 'express'
import authUser from '../middlewares/authUser.js'
import {
    addDoctorReview,
    getDoctorReviews,
    updateDoctorReview,
    deleteDoctorReview
  } from '../controllers/doctorReviewController.js'
const docReviewRouter = express.Router()

docReviewRouter.post('/:doctorId',authUser,addDoctorReview);

docReviewRouter.get('/:doctorId',getDoctorReviews);
docReviewRouter.post('/update-review/:reviewId', authUser, updateDoctorReview);

docReviewRouter.get('/delete/:reviewId',authUser, deleteDoctorReview);

docReviewRouter.post('/:reviewId',authUser,updateDoctorReview);

docReviewRouter.get('/:reviewId',authUser,deleteDoctorReview);
export default docReviewRouter