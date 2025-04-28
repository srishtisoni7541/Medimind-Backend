import JournalEntry from '../models/JournalEntry.js';
import MoodTracker from '../models/MoodTracker.js';
import { analyzeJournalContent } from '../services/aiAnalysis.js';

// Create a new journal entry
export const createEntry = async (req, res) => {
  try {
    const { title, content, mood, emotions, activities, tags } = req.body;
    const userId = req.user._id;
    
    // Analyze content with AI
    const analysis = await analyzeJournalContent(content, mood, emotions);
    
    // Create journal entry
    const newEntry = new JournalEntry({
      user: userId,
      title,
      content,
      mood,
      emotions,
      activities,
      tags,
      aiAnalysis: {
        ...analysis,
        createdAt: new Date(),
      },
    });
    
    await newEntry.save();
    
    // Also add to mood tracker for trends
    const moodEntry = new MoodTracker({
      user: userId,
      mood,
      note: title,
      factors: emotions.map(emotion => ({
        factor: emotion,
        impact: emotion === 'happy' || emotion === 'calm' || emotion === 'content' || 
                emotion === 'energetic' || emotion === 'hopeful' || emotion === 'grateful' ? 3 : -3
      })),
    });
    
    await moodEntry.save();
    
    res.status(201).json({
      success: true,
      entry: newEntry,
      analysis: analysis,
    });
  } catch (error) {
    console.error('Journal entry creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating journal entry' 
    });
  }
};

// Get all journal entries for a user
export const getEntries = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, sort = 'desc' } = req.query;
    
    const entries = await JournalEntry.find({ user: userId })
      .sort({ createdAt: sort === 'asc' ? 1 : -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await JournalEntry.countDocuments({ user: userId });
    
    res.status(200).json({
      success: true,
      entries,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalEntries: count,
    });
  } catch (error) {
    console.error('Journal entries fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching journal entries' 
    });
  }
};

// Get a specific journal entry
export const getEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const entryId = req.params.id;
    
    const entry = await JournalEntry.findOne({
      _id: entryId,
      user: userId,
    });
    
    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Journal entry not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      entry,
    });
  } catch (error) {
    console.error('Journal entry fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching journal entry' 
    });
  }
};

// Update a journal entry
export const updateEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const entryId = req.params.id;
    const { title, content, mood, emotions, activities, tags } = req.body;
    
    // Check if entry exists and belongs to user
    const entry = await JournalEntry.findOne({
      _id: entryId,
      user: userId,
    });
    
    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Journal entry not found' 
      });
    }
    
    // Re-analyze content if it changed
    let analysis = entry.aiAnalysis;
    if (content !== entry.content || mood !== entry.mood || 
        JSON.stringify(emotions) !== JSON.stringify(entry.emotions)) {
      analysis = await analyzeJournalContent(content, mood, emotions);
      analysis.createdAt = new Date();
    }
    
    // Update entry
    const updatedEntry = await JournalEntry.findByIdAndUpdate(
      entryId,
      {
        title,
        content,
        mood,
        emotions,
        activities,
        tags,
        aiAnalysis: analysis,
      },
      { new: true }
    );
    
    // Update mood tracker entry if it exists for this date
    const entryDate = new Date(entry.createdAt);
    entryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(entryDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    await MoodTracker.findOneAndUpdate(
      { 
        user: userId,
        date: {
          $gte: entryDate,
          $lt: nextDay
        }
      },
      {
        mood,
        note: title,
        factors: emotions.map(emotion => ({
          factor: emotion,
          impact: emotion === 'happy' || emotion === 'calm' || emotion === 'content' || 
                  emotion === 'energetic' || emotion === 'hopeful' || emotion === 'grateful' ? 3 : -3
        })),
      }
    );
    
    res.status(200).json({
      success: true,
      entry: updatedEntry,
    });
  } catch (error) {
    console.error('Journal entry update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating journal entry' 
    });
  }
};

// Delete a journal entry
export const deleteEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const entryId = req.params.id;
    
    const entry = await JournalEntry.findOneAndDelete({
      _id: entryId,
      user: userId,
    });
    
    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Journal entry not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Journal entry deleted successfully',
    });
  } catch (error) {
    console.error('Journal entry deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting journal entry' 
    });
  }
};
