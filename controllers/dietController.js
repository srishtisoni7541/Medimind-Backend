import User from '../models/User.js';
import MealPlan from '../models/MealPlan.js';
import dietService from '../services/dietService.js';

export const submitHealthData = async (req, res) => {
  try {
    const { age, gender, height, weight, activityLevel, weightGoal } = req.body;

    const bmi = dietService.calculateBMI(height, weight);
    const dailyCalories = dietService.calculateDailyCalories(age, gender, height, weight, activityLevel, weightGoal);

    const user = new User({
      age, gender, height, weight, activityLevel, weightGoal, bmi, dailyCalories
    });

    await user.save();

    const mealPlan = await dietService.generateMealPlan({ 
      age, gender, height, weight, activityLevel, weightGoal, dailyCalories, bmi 
    });

    const newMealPlan = new MealPlan({
      userId: user._id,
      ...mealPlan
    });

    await newMealPlan.save();

    res.status(201).json({
      user: { ...user._doc },
      mealPlan: { ...newMealPlan._doc }
    });
  } catch (err) {
    console.error('Error in health-data:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
};

export const regenerateMealPlan = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const mealPlan = await dietService.generateMealPlan(user);

    const newMealPlan = new MealPlan({
      userId: user._id,
      ...mealPlan
    });

    await newMealPlan.save();

    res.status(201).json({ mealPlan: { ...newMealPlan._doc } });
  } catch (err) {
    console.error('Error in regenerate-meal-plan:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
};

export const getMealPlanHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const mealPlans = await MealPlan.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ mealPlans });
  } catch (err) {
    console.error('Error in meal-plan-history:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
};
