import mongoose from 'mongoose';

const MealSchema = new mongoose.Schema({
  name: String,
  calories: Number,
  carbs: Number,
  protein: Number,
  fats: Number,
  description: String
});

const MealPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserDiet', required: true },
  breakfast: MealSchema,
  lunch: MealSchema,
  dinner: MealSchema,
  totalCalories: Number,
  totalCarbs: Number,
  totalProtein: Number,
  totalFats: Number,
  createdAt: { type: Date, default: Date.now }
});

const MealPlan = mongoose.model('MealPlan', MealPlanSchema);
export default MealPlan;
