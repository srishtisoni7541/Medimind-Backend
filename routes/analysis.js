import express from 'express';
import { 
  getMoodTrends, 
  getInsights, 
  createTherapyPlan, 
  getTherapyPlans 
} from '../controllers/analysisController.js';
import auth from '../middlewares/authUser.js';

const router = express.Router();

router.use(auth); // All analysis routes require authentication

router.get('/mood-trends', getMoodTrends);
router.get('/insights', getInsights);
router.post('/therapy-plan', createTherapyPlan);
router.get('/therapy-plans', getTherapyPlans);

export default router;