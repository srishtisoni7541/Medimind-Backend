import express from 'express';
import { getMedicationSuggestions, getMedicationDetails } from '../controllers/medicationController.js';

const router = express.Router();

// Route for medication suggestions
router.get('/suggestions', getMedicationSuggestions);

// Route for medication details
router.get('/details/:name', getMedicationDetails);

export default router;
