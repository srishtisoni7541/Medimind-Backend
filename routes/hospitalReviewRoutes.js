import express from 'express';
import authUser from '../middlewares/authUser.js'
import { 
  addHospitalReview, 
  updateHospitalReview, 
  getHospitalReviews, 
  deleteHospitalReview 
} from '../controllers/hospitalReviewController.js';

const router = express.Router();

router.post('/:hospitalId',authUser, addHospitalReview);
router.post('/update-review/:reviewId',authUser, updateHospitalReview);

router.get('/:hospitalId', getHospitalReviews);
router.get('/delete/:reviewId',authUser, deleteHospitalReview);

router.post('/:reviewId',authUser, updateHospitalReview);
router.get('/:reviewId',authUser, deleteHospitalReview);

export default router;