import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to get medication suggestions based on partial input
export const getMedicationSuggestions = async (partialName) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
      As a medical AI assistant, provide a list of 5 common medication names that start with or closely match: "${partialName}".
      Return only the medication names in a JSON array format. For example: ["Medication1", "Medication2", "Medication3", "Medication4", "Medication5"]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const regex = /\[(.*)\]/s;
    const match = text.match(regex);

    if (match && match[1]) {
      return JSON.parse(`[${match[1]}]`);
    }

    return [];
  } catch (error) {
    console.error('Error getting medication suggestions:', error);
    throw error;
  }
};

// Function to get detailed medication information
export const getMedicationDetails = async (medicationName) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
      Provide comprehensive information about the medication "${medicationName}" in JSON format with the following structure:
      {
        "name": "Full medication name",
        "uses": ["List of common uses"],
        "sideEffects": ["List of common side effects"],
        "warnings": ["List of warnings and precautions"],
        "missedDose": "Instructions for missed dose",
        "overdose": "Instructions for overdose",
        "description": "Brief description of the medication"
      }

      Ensure the information is factual, comprehensive but concise, and formatted exactly as requested.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/({.*})/s);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }

    throw new Error('Failed to parse medication details');
  } catch (error) {
    console.error('Error getting medication details:', error);
    throw error;
  }
};
