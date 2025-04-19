import express from 'express';
import {
  submitHealthData,
  regenerateMealPlan,
  getMealPlanHistory
} from '../controllers/dietController.js';

const router = express.Router();

router.post('/health-data', submitHealthData);
router.post('/regenerate-meal-plan/:userId', regenerateMealPlan);
router.get('/meal-plan-history/:userId', getMealPlanHistory);

export default router;
