import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const createFollowUpQuestionsPrompt = (age, sex, symptoms) => {
  return `
    You are a medical assistant tasked with collecting additional information about a patient's symptoms.
    
    Patient Information:
    - Age: ${age}
    - Sex: ${sex}
    - Initial Symptoms Description: ${symptoms}
    
    Based on these initial symptoms, generate 3-5 specific follow-up questions that would help clarify the condition.
    The questions should help identify important factors like:
    - Duration and progression of symptoms
    - Any alleviating or aggravating factors
    - Related symptoms that might not have been mentioned
    - Medical history relevance
    - Lifestyle factors that may influence the condition
    
    Please provide your response in JSON format with the following structure:
    {
      "questions": [
        "Question 1",
        "Question 2",
        "Question 3",
        "Question 4",
        "Question 5"
      ]
    }
  `;
};

const createSymptomAnalysisPrompt = (age, sex, symptoms, followUpAnswers) => {
  const followUpSection =
    followUpAnswers && followUpAnswers.length > 0
      ? `\nAdditional Information from Follow-up Questions:\n${followUpAnswers
          .map(
            (qa) =>
              `- Question: ${qa.question}\n  Answer: ${qa.answer}`
          )
          .join('\n')}`
      : '';

  return `
    You are a medical symptom analyzer. Based on the following patient information, analyze the symptoms 
    and provide possible conditions that match these symptoms. For each condition, include a probability 
    (High, Medium, or Low) and a brief description.

    Patient Information:
    - Age: ${age}
    - Sex: ${sex}
    - Initial Symptoms: ${symptoms}${followUpSection}

    Please provide your analysis in JSON format with the following structure:
    {
      "conditions": [
        {
          "name": "Condition Name",
          "probability": "High/Medium/Low",
          "description": "Brief description of the condition"
        }
      ]
    }

    Limit your response to the 3-5 most likely conditions.
  `;
};

const createConditionDetailsPrompt = (condition) => {
  return `
    You are a medical information provider. Please provide detailed information about the following medical condition:
    
    Condition: ${condition}
    
    Please provide your response in JSON format with the following structure:
    {
      "overview": "General overview of the condition",
      "causes": "What causes this condition",
      "riskFactors": ["Risk factor 1", "Risk factor 2", ...],
      "complications": ["Possible complication 1", "Possible complication 2", ...],
      "prevention": ["Prevention method 1", "Prevention method 2", ...]
    }
  `;
};

const createTreatmentOptionsPrompt = (condition) => {
  return `
    You are a medical information provider. Please provide treatment options for the following medical condition:
    
    Condition: ${condition}
    
    Please provide your response in JSON format with the following structure:
    {
      "medications": [
        {
          "name": "Medication name",
          "description": "Brief description of the medication"
        }
      ],
      "homeCare": ["Home care method 1", "Home care method 2", ...],
      "lifestyle": ["Lifestyle change 1", "Lifestyle change 2", ...],
      "whenToSeeDoctor": ["Warning sign 1", "Warning sign 2", ...]
    }
  `;
};

const createMedicationSuggestionsPrompt = (partialName) => {
  return `
    As a medical AI assistant, provide a list of 5 common medication names that start with or closely match: "${partialName}".
    Return only the medication names in a JSON array format. For example: ["Medication1", "Medication2", "Medication3", "Medication4", "Medication5"]
  `;
};

const createMedicationDetailsPrompt = (medicationName) => {
  return `
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
};

// ------------------------------
// Helper to extract JSON
// ------------------------------

const extractJsonFromResponse = (responseText) => {
  try {
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/);

    if (jsonMatch) {
      const jsonString = jsonMatch[1] || jsonMatch[2];
      return JSON.parse(jsonString.trim());
    }

    return JSON.parse(responseText.trim());
  } catch (error) {
    console.error("Error extracting JSON from response:", error);
    throw new Error("Failed to parse AI response");
  }
};
const callGemini = async (prompt, retries = 3) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result.text();
    } catch (error) {
      if (error.status === 429 && i < retries - 1) {
        console.warn(`Gemini rate limit hit. Retrying in 60s... (${i + 1}/${retries})`);
        await delay(60000);
      } else if (error.status === 429) {
        throw new Error("Gemini API quota exceeded. Please try again later.");
      } else {
        throw error;
      }
    }
  }
};
export const generateFollowUpQuestions = async (age, sex, symptoms) => {
  try {
    const prompt = createFollowUpQuestionsPrompt(age, sex, symptoms);
    const responseText = await callGemini(prompt);
    return extractJsonFromResponse(responseText);
  } catch (error) {
    console.error("Error in Gemini service (generateFollowUpQuestions):", error);
    throw error;
  }
};

export const analyzeSymptoms = async (age, sex, symptoms, followUpAnswers = []) => {
  try {
    const prompt = createSymptomAnalysisPrompt(age, sex, symptoms, followUpAnswers);
    const responseText = await callGemini(prompt);
    return extractJsonFromResponse(responseText);
  } catch (error) {
    console.error("Error in Gemini service (analyzeSymptoms):", error);
    throw error;
  }
};

export const getConditionDetails = async (condition) => {
  try {
    const prompt = createConditionDetailsPrompt(condition);
    const responseText = await callGemini(prompt);
    return extractJsonFromResponse(responseText);
  } catch (error) {
    console.error("Error in Gemini service (getConditionDetails):", error);
    throw error;
  }
};

export const getTreatmentOptions = async (condition) => {
  try {
    const prompt = createTreatmentOptionsPrompt(condition);
    const responseText = await callGemini(prompt);
    return extractJsonFromResponse(responseText);
  } catch (error) {
    console.error("Error in Gemini service (getTreatmentOptions):", error);
    throw error;
  }
};

export const getMedicationSuggestions = async (partialName) => {
  try {
    const prompt = createMedicationSuggestionsPrompt(partialName);
    const responseText = await callGemini(prompt);
    const jsonMatch = responseText.match(/\[([\s\S]*?)\]/);
    if (jsonMatch && jsonMatch[0]) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error("Error in Gemini service (getMedicationSuggestions):", error);
    throw error;
  }
};

export const getMedicationDetails = async (medicationName) => {
  try {
    const prompt = createMedicationDetailsPrompt(medicationName);
    const responseText = await callGemini(prompt);
    const jsonMatch = responseText.match(/({[\s\S]*})/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    throw new Error("Failed to parse medication details");
  } catch (error) {
    console.error("Error in Gemini service (getMedicationDetails):", error);
    throw error;
  }
};