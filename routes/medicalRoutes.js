import express from 'express';
import * as medicalController from '../controllers/medicalController.js';
import * as geminiService from '../services/geminiService.js';

const router = express.Router();

// Log middleware
router.use((req, res, next) => {
  console.log('Request URL:', req.originalUrl);
  console.log('Request Method:', req.method);
  console.log('Request Params:', req.params);
  next();
});

// Generate follow-up questions based on initial symptoms
router.post('/gemini/follow-up-questions', async (req, res) => {
  try {
    const { age, sex, symptoms } = req.body;
    
    if (!age || !sex || !symptoms) {
      return res.status(400).json({ error: 'Age, sex, and symptoms are required' });
    }
    
    console.log('Generating follow-up questions for:', { age, sex });
    const result = await geminiService.generateFollowUpQuestions(age, sex, symptoms);
    res.json(result);
  } catch (error) {
    console.error('Error in follow-up questions route:', error);
    res.status(500).json({ message: 'Failed to generate follow-up questions' });
  }
});

// Analyze symptoms with optional follow-up answers
router.post('/gemini/analyze', async (req, res) => {
  try {
    const { age, sex, symptoms, followUpAnswers } = req.body;
    
    if (!age || !sex || !symptoms) {
      return res.status(400).json({ error: 'Age, sex, and symptoms are required' });
    }
    
    console.log('Analyzing symptoms with follow-up answers');
    const result = await geminiService.analyzeSymptoms(age, sex, symptoms, followUpAnswers);
    res.json(result);
  } catch (error) {
    console.error('Error in analyze route:', error);
    res.status(500).json({ message: 'Failed to analyze symptoms' });
  }
});

// Condition details endpoint
router.get('/condition-details/:conditionName', async (req, res) => {
  try {
    const { conditionName } = req.params;
    console.log('Condition name received:', conditionName);
    
    if (!conditionName) {
      return res.status(400).json({ error: 'Condition name is required' });
    }
    
    const decodedName = decodeURIComponent(conditionName);
    console.log('Decoded condition name:', decodedName);
    
    const details = await geminiService.getConditionDetails(decodedName);
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

// Treatment options route
router.get('/treatments/:conditionName', async (req, res) => {
  try {
    const { conditionName } = req.params;
    
    if (!conditionName) {
      return res.status(400).json({ error: 'Condition name is required' });
    }
    
    const decodedName = decodeURIComponent(conditionName);
    console.log('Decoded condition name for treatments:', decodedName);
    
    const treatments = await geminiService.getTreatmentOptions(decodedName);
    
    res.json({ treatments });
  } catch (error) {
    console.error('Error in treatments route:', error);
    res.status(500).json({
      error: 'Failed to get treatment suggestions',
      details: error.message
    });
  }
});

// Save session data
router.post('/save-session', medicalController.saveCheckupSession);

export default router;