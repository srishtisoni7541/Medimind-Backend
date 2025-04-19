import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  age: Number,
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  height: Number,
  weight: Number,
  activityLevel: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'], required: true },
  weightGoal: { type: String, enum: ['lose', 'maintain', 'gain'], required: true },
  bmi: Number,
  dailyCalories: Number,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('UserDiet', UserSchema);
export default User;
