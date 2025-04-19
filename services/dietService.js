import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Calculate BMI
function calculateBMI(height, weight) {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

// Calculate daily calorie needs
function calculateDailyCalories(age, gender, height, weight, activityLevel, weightGoal) {
  let bmr;

  if (gender === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  let activityMultiplier;
  switch (activityLevel) {
    case 'sedentary': activityMultiplier = 1.2; break;
    case 'light': activityMultiplier = 1.375; break;
    case 'moderate': activityMultiplier = 1.55; break;
    case 'active': activityMultiplier = 1.725; break;
    case 'very_active': activityMultiplier = 1.9; break;
    default: activityMultiplier = 1.2;
  }

  let totalCalories = bmr * activityMultiplier;

  switch (weightGoal) {
    case 'lose': totalCalories -= 500; break;
    case 'gain': totalCalories += 500; break;
    case 'maintain':
    default: break;
  }

  return Math.round(totalCalories);
}

// Generate meal with AI
async function generateMealWithAI(mealType, targetCalories, userData) {
  try {
    const prompt = `
Generate a healthy Indian ${mealType} recipe that is approximately ${targetCalories} calories.
The person is a ${userData.age}-year-old ${userData.gender} who is ${userData.activityLevel} active and wants to ${userData.weightGoal} weight.
Their BMI is ${userData.bmi ? userData.bmi.toFixed(1) : 'not provided'}.

Respond ONLY with a valid JSON object in the following format (no markdown, no extra text):
{
  "name": "Dish Name",
  "calories": 300,
  "carbs": 40,
  "protein": 15,
  "fats": 10,
  "description": "Brief description of the dish with portion size"
}
`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Clean up Markdown-style backticks
    if (responseText.startsWith("```")) {
      responseText = responseText.replace(/```json\s*([\s\S]*?)\s*```/, '$1')
                                .replace(/```\s*([\s\S]*?)\s*```/, '$1')
                                .trim();
    }

    const mealData = JSON.parse(responseText);

    if (!mealData.name || typeof mealData.calories !== 'number' ||
        typeof mealData.carbs !== 'number' || typeof mealData.protein !== 'number' ||
        typeof mealData.fats !== 'number' || !mealData.description) {
      throw new Error(`Invalid structure in AI response for ${mealType}`);
    }

    return mealData;

  } catch (error) {
    console.error(`❌ Error generating ${mealType} with AI:`, error.message);

    const fallback = {
      name: `Default ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`,
      calories: targetCalories,
      carbs: Math.round(targetCalories * 0.5 / 4),
      protein: Math.round(targetCalories * 0.25 / 4),
      fats: Math.round(targetCalories * 0.25 / 9),
      description: `A balanced ${mealType} with around ${targetCalories} calories`
    };

    return fallback;
  }
}

// Generate full meal plan
async function generateMealPlan(userData) {
  const dailyCalories = userData.dailyCalories || calculateDailyCalories(
    userData.age,
    userData.gender,
    userData.height,
    userData.weight,
    userData.activityLevel,
    userData.weightGoal
  );

  const bmi = calculateBMI(userData.height, userData.weight);
  userData.bmi = bmi;

  const breakfastCalories = Math.round(dailyCalories * 0.3);
  const lunchCalories = Math.round(dailyCalories * 0.35);
  const dinnerCalories = Math.round(dailyCalories * 0.35);

  const [breakfast, lunch, dinner] = await Promise.all([
    generateMealWithAI('breakfast', breakfastCalories, userData),
    generateMealWithAI('lunch', lunchCalories, userData),
    generateMealWithAI('dinner', dinnerCalories, userData)
  ]);

  const totalCalories = breakfast.calories + lunch.calories + dinner.calories;
  const totalCarbs = breakfast.carbs + lunch.carbs + dinner.carbs;
  const totalProtein = breakfast.protein + lunch.protein + dinner.protein;
  const totalFats = breakfast.fats + lunch.fats + dinner.fats;

  return {
    bmi: bmi.toFixed(1),
    dailyCalories,
    breakfast,
    lunch,
    dinner,
    totalCalories,
    totalCarbs,
    totalProtein,
    totalFats
  };
}

export default {
  calculateBMI,
  calculateDailyCalories,
  generateMealPlan
};
