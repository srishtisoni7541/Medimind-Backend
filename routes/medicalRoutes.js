import express from 'express';
import { saveCheckupSession } from '../controllers/medicalController.js';
import {
  analyzeSymptoms,
  getConditionDetails,
  getTreatmentOptions
} from '../services/geminiService.js';

const router = express.Router();

// Log middleware
router.use((req, res, next) => {
  console.log('Request URL:', req.originalUrl);
  console.log('Request Method:', req.method);
  console.log('Request Params:', req.params);
  next();
});

router.post('/gemini/analyze', async (req, res) => {
  try {
    const { age, sex, symptoms } = req.body;
    const result = await analyzeSymptoms(age, sex, symptoms);
    res.json(result);
  } catch (error) {
    console.error('Error in analyze route:', error);
    res.status(500).json({ message: 'Failed to analyze symptoms' });
  }
});

router.get('/condition-details/:conditionName', async (req, res) => {
  try {
    const { conditionName } = req.params;
    console.log('Condition name received:', conditionName);

    if (!conditionName) {
      return res.status(400).json({ error: 'Condition name is required' });
    }

    const decodedName = decodeURIComponent(conditionName);
    console.log('Decoded condition name:', decodedName);

    const details = await getConditionDetails(decodedName);
    console.log('Condition details retrieved successfully');

    res.json({ details });
  } catch (error) {
    console.error('Error in condition details route:', error);
    res.status(500).json({ 
      error: 'Failed to get condition details', 
      details: error.message 
    });
  }
});

router.get('/treatments/:conditionName', async (req, res) => {
  try {
    const { conditionName } = req.params;

    if (!conditionName) {
      return res.status(400).json({ error: 'Condition name is required' });
    }

    const decodedName = decodeURIComponent(conditionName);
    console.log('Decoded condition name for treatments:', decodedName);

    const treatments = await getTreatmentOptions(decodedName);

    res.json({ treatments });
  } catch (error) {
    console.error('Error in treatments route:', error);
    res.status(500).json({ 
      error: 'Failed to get treatment suggestions', 
      details: error.message 
    });
  }
});

router.post('/save-session', saveCheckupSession);

export default router;
