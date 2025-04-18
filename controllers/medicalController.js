import CheckupSession from '../models/CheckupSession.js';
import {
  analyzeSymptoms as analyzeGeminiSymptoms,
  getConditionDetails,
  getTreatmentOptions
} from '../services/geminiService.js';

// Analyze symptoms using Gemini AI
export const analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;
    const analysis = await analyzeGeminiSymptoms(symptoms);
    res.json({ conditions: analysis });
  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    res.status(500).json({ error: 'Failed to analyze symptoms' });
  }
};

// Get detailed information about a condition
export const getConditionDetailsController = async (req, res) => {
  try {
    const { condition } = req.query;

    if (!condition) {
      return res.status(400).json({ message: 'Please provide condition name' });
    }

    const details = await getConditionDetails(condition);
    res.status(200).json(details);
  } catch (error) {
    console.error('Error getting condition details:', error);
    res.status(500).json({ message: 'Failed to get condition details', error: error.message });
  }
};

// Get treatment options for a condition
export const getTreatments = async (req, res) => {
  try {
    const { condition } = req.query;

    if (!condition) {
      return res.status(400).json({ message: 'Please provide condition name' });
    }

    const treatments = await getTreatmentOptions(condition);
    res.status(200).json(treatments);
  } catch (error) {
    console.error('Error getting treatment options:', error);
    res.status(500).json({ message: 'Failed to get treatment options', error: error.message });
  }
};

// Save the checkup session data
export const saveCheckupSession = async (req, res) => {
  try {
    const sessionData = req.body;

    const session = new CheckupSession(sessionData);
    await session.save();

    res.status(201).json({ message: 'Session saved successfully', sessionId: session._id });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ message: 'Failed to save session', error: error.message });
  }
};
