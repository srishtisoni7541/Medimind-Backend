import { getMedicationSuggestions as fetchSuggestions, getMedicationDetails as fetchDetails } from '../services/geminiServicetwo.js';

// Controller for medication suggestions
export const getMedicationSuggestions = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 2 characters long',
      });
    }

    const suggestions = await fetchSuggestions(query);

    return res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('Error in getMedicationSuggestions controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get medication suggestions',
      error: error.message,
    });
  }
};

// Controller for medication details
export const getMedicationDetails = async (req, res) => {
  try {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Medication name is required',
      });
    }

    const details = await fetchDetails(name);

    return res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error('Error in getMedicationDetails controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get medication details',
      error: error.message,
    });
  }
};
