import JournalEntry from '../models/JournalEntry.js';
import MoodTracker from '../models/MoodTracker.js';
import TherapyPlan from '../models/TherapyPlan.js';
import { generateInsights, generateTherapyPlan } from '../services/aiAnalysis.js';

// Get mood trends analysis
export const getMoodTrends = async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeFrame = 'month' } = req.query;
    
    // Calculate date range based on timeFrame
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeFrame) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // Get mood data for the time range
    const moodData = await MoodTracker.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    // Calculate stats
    const moodValues = moodData.map(entry => entry.mood);
    const avgMood = moodValues.length > 0 
      ? moodValues.reduce((sum, mood) => sum + mood, 0) / moodValues.length 
      : 0;
    
    // Get factors that most impact mood
    const factorImpact = {};
    moodData.forEach(entry => {
      entry.factors.forEach(factor => {
        if (!factorImpact[factor.factor]) {
          factorImpact[factor.factor] = {
            totalImpact: 0,
            count: 0
          };
        }
        factorImpact[factor.factor].totalImpact += factor.impact;
        factorImpact[factor.factor].count += 1;
      });
    });
    
    // Calculate average impact for each factor
    const topFactors = Object.keys(factorImpact).map(factor => ({
      factor,
      avgImpact: factorImpact[factor].totalImpact / factorImpact[factor].count
    })).sort((a, b) => Math.abs(b.avgImpact) - Math.abs(a.avgImpact)).slice(0, 5);
    
    res.status(200).json({
      success: true,
      moodData: moodData.map(entry => ({
        date: entry.date,
        mood: entry.mood,
        note: entry.note
      })),
      stats: {
        average: avgMood,
        highest: Math.max(...moodValues) || 0,
        lowest: Math.min(...moodValues) || 0,
        topFactors
      }
    });
  } catch (error) {
    console.error('Mood trends analysis error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while generating mood trends' 
    });
  }
};

// Get personalized insights
export const getInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get recent journal entries
    const recentEntries = await JournalEntry.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get recent mood data
    const recentMoods = await MoodTracker.find({ user: userId })
      .sort({ date: -1 })
      .limit(30);
    
    // Generate AI insights
    const insights = await generateInsights(recentEntries, recentMoods);
    
    res.status(200).json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('Insights generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while generating insights' 
    });
  }
};

// Generate therapy plan
export const createTherapyPlan = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get recent journal entries and mood data
    const recentEntries = await JournalEntry.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(15);
    
    const recentMoods = await MoodTracker.find({ user: userId })
      .sort({ date: -1 })
      .limit(30);
    
    // Generate therapy plan using AI
    const planData = await generateTherapyPlan(recentEntries, recentMoods);
    
    // Create therapy plan in database
    const newPlan = new TherapyPlan({
      user: userId,
      ...planData,
      aiGenerated: true
    });
    
    await newPlan.save();
    
    res.status(201).json({
      success: true,
      plan: newPlan
    });
  } catch (error) {
    console.error('Therapy plan generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while generating therapy plan' 
    });
  }
};

// Get user's therapy plans
export const getTherapyPlans = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const plans = await TherapyPlan.find({ user: userId })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Therapy plans fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching therapy plans' 
    });
  }
};
