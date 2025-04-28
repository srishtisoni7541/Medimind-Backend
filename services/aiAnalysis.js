import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI (you would need to set up your own API key)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mock analysis function for when OpenAI API is not available
const mockAnalysis = (content, mood, emotions) => {
  // Default values for when OpenAI API is not available
  const sentimentScore = mood > 5 ? mood - 5 : mood - 6; // Convert 1-10 to -5 to +5
  
  const positiveEmotions = ['happy', 'calm', 'content', 'energetic', 'hopeful', 'grateful'];
  const hasPositiveEmotions = emotions.some(e => positiveEmotions.includes(e));
  
  let emotionalTone = 'neutral';
  if (sentimentScore > 2) emotionalTone = 'positive';
  else if (sentimentScore < -2) emotionalTone = 'negative';
  
  // Basic suggested activities based on mood
  let activities = [];
  if (mood <= 4) {
    activities = [
      'Take a short walk outside',
      'Practice 5 minutes of deep breathing',
      'Call a supportive friend or family member'
    ];
  } else if (mood <= 7) {
    activities = [
      'Listen to uplifting music',
      'Write down 3 things you\'re grateful for',
      'Do a hobby you enjoy for 30 minutes'
    ];
  } else {
    activities = [
      'Share your positive energy with someone else',
      'Plan something you\'re looking forward to',
      'Reflect on what contributed to your good mood'
    ];
  }
  
  // Generate insight based on mood and emotions
  let insight = '';
  if (mood <= 4) {
    insight = "You're experiencing some challenging emotions right now. Remember that difficult feelings are temporary and it's okay to ask for support when needed.";
  } else if (mood <= 7) {
    insight = "You're in a balanced emotional state. This is a good time to reflect on what helps maintain your wellbeing and build resilience for more challenging times.";
  } else {
    insight = "You're experiencing positive emotions right now. Try to notice what contributes to these feelings so you can return to these activities when you need a boost.";
  }
  
  // Check for concerning patterns
  const warningFlags = [];
  if (mood <= 3) {
    warningFlags.push('Low mood detected');
  }
  if (emotions.includes('anxious') && emotions.includes('stressed')) {
    warningFlags.push('Anxiety and stress combination');
  }
  
  return {
    sentimentScore,
    emotionalTone,
    suggestedActivities: activities,
    insights: insight,
    warningFlags
  };
};

// Analyze journal content
export const analyzeJournalContent = async (content, mood, emotions) => {
  try {
    // If no OpenAI key is set, return mock analysis (for development)
    if (!process.env.OPENAI_API_KEY) {
      return mockAnalysis(content, mood, emotions);
    }

    const prompt = `
      Analyze the following journal entry and provide mental health insights:
      
      Journal Content: "${content}"
      
      Self-reported Mood (1-10): ${mood}
      Self-reported Emotions: ${emotions.join(', ')}
      
      Provide a JSON response with the following information:
      1. sentimentScore: A numerical score from -10 to 10 representing the overall sentiment
      2. emotionalTone: The primary emotional tone detected
      3. suggestedActivities: A list of 3 activities that might help the user based on their current state
      4. insights: A short paragraph with mental health insights
      5. warningFlags: Any concerning patterns that might need attention (list of strings, or empty array if none)
    `;

    const response = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.3,
    });

    const analysisText = response.choices[0].text.trim();
    return JSON.parse(analysisText);
  } catch (error) {
    console.error('AI analysis error:', error);
    return mockAnalysis(content, mood, emotions);
  }
};

// Generate personalized insights
export const generateInsights = async (recentEntries, recentMoods) => {
  try {
    // Mock insights for development or if no API key
    if (!process.env.OPENAI_API_KEY || recentEntries.length === 0) {
      return {
        summary: "Based on your recent entries, you've been experiencing ups and downs in your mood. There are some consistent patterns in activities that affect your well-being.",
        patterns: [
          "Your mood tends to improve after physical activity",
          "Social interactions generally have a positive impact on your emotional state",
          "Work-related stress appears frequently in lower mood days"
        ],
        recommendations: [
          "Consider scheduling regular exercise sessions",
          "Plan more social activities with close friends",
          "Practice mindfulness techniques before stressful work situations"
        ],
        progressNotes: "You've made progress in recognizing your emotional triggers. Continue building on this awareness."
      };
    }

    // Prepare data for analysis
    const journalData = recentEntries.map(entry => ({
      date: entry.createdAt,
      content: entry.content,
      mood: entry.mood,
      emotions: entry.emotions,
    }));

    const moodData = recentMoods.map(mood => ({
      date: mood.date,
      mood: mood.mood,
      factors: mood.factors,
    }));

    const prompt = `
      Generate personalized mental health insights based on the following journal entries and mood data:
      
      Journal Entries: ${JSON.stringify(journalData)}
      
      Mood Data: ${JSON.stringify(moodData)}
      
      Provide a JSON response with the following information:
      1. summary: A brief summary of the user's recent mental state
      2. patterns: An array of identified patterns affecting the user's mental health
      3. recommendations: An array of personalized recommendations
      4. progressNotes: Notes on the user's progress in their mental health journey
    `;

    const response = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      max_tokens: 800,
      temperature: 0.4,
    });

    const insightsText = response.choices[0].text.trim();
    return JSON.parse(insightsText);
  } catch (error) {
    console.error('Insights generation error:', error);
    // Return default insights if there's an error
    return {
      summary: "Based on recent activity, there appear to be some patterns in your mood and emotional responses.",
      patterns: [
        "Physical activity correlates with improved mood",
        "Social connections seem to have a positive impact",
        "Sleep quality appears to affect your emotional state"
      ],
      recommendations: [
        "Consider establishing a regular exercise routine",
        "Prioritize quality social interactions",
        "Work on improving sleep hygiene"
      ],
      progressNotes: "Continue recording your daily experiences to gain deeper insights."
    };
  }
};

// Generate therapy plan
export const generateTherapyPlan = async (recentEntries, recentMoods) => {
  try {
    // If no entries or no API key, return a basic plan
    if (!process.env.OPENAI_API_KEY || recentEntries.length === 0) {
      return createBasicTherapyPlan(recentMoods);
    }
    
    // Extract relevant data for analysis
    const journalData = recentEntries.map(entry => ({
      content: entry.content.substring(0, 200) + '...',  // Truncate for API limits
      mood: entry.mood,
      emotions: entry.emotions,
      analysis: entry.aiAnalysis?.insights || ''
    }));
    
    const moodData = recentMoods.slice(0, 10).map(mood => ({
      date: mood.date,
      mood: mood.mood,
      factors: mood.factors.map(f => f.factor).join(', ')
    }));
    
    const prompt = `
      Create a personalized therapy plan based on the following journal and mood data:
      
      Recent Journal Insights: ${JSON.stringify(journalData)}
      Recent Mood Data: ${JSON.stringify(moodData)}
      
      Create a structured therapy plan with:
      1. A title for the plan
      2. A brief description
      3. 3-5 techniques or exercises with descriptions and recommended frequency
      4. 2-3 measurable goals
      5. 3-5 resources that might be helpful
      
      Provide the response as a JSON object with the following structure:
      {
        "title": "Plan title",
        "description": "Plan description",
        "techniques": [{"name": "Technique name", "description": "Description", "frequency": "Daily/Weekly etc"}],
        "goals": [{"description": "Goal description", "targetDate": "2 weeks from now" or similar}],
        "resources": [{"type": "article/video/exercise", "title": "Resource title", "description": "Brief description"}]
      }
    `;
    
    const response = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      max_tokens: 1000,
      temperature: 0.4,
    });
    
    const planText = response.choices[0].text.trim();
    const plan = JSON.parse(planText);
    
    // Process dates for goals
    plan.goals = plan.goals.map(goal => {
      // Convert text dates to actual Date objects
      let targetDate = new Date();
      if (goal.targetDate.includes('week')) {
        const weeks = parseInt(goal.targetDate) || 2;
        targetDate.setDate(targetDate.getDate() + (weeks * 7));
      } else if (goal.targetDate.includes('month')) {
        const months = parseInt(goal.targetDate) || 1;
        targetDate.setMonth(targetDate.getMonth() + months);
      } else {
        // Default to 2 weeks
        targetDate.setDate(targetDate.getDate() + 14);
      }
      
      return {
        ...goal,
        targetDate,
        completed: false,
        progress: 0
      };
    });
    
    // Initialize completion fields for techniques
    plan.techniques = plan.techniques.map(technique => ({
      ...technique,
      completed: []
    }));
    
    // Add completion field to resources
    plan.resources = plan.resources.map(resource => ({
      ...resource,
      completed: false
    }));
    
    return plan;
  } catch (error) {
    console.error('Therapy plan generation error:', error);
    return createBasicTherapyPlan(recentMoods);
  }
};

// Fallback function to create a basic therapy plan
const createBasicTherapyPlan = (recentMoods) => {
  // Calculate average mood if moods are available
  let avgMood = 5;
  if (recentMoods && recentMoods.length > 0) {
    const moodSum = recentMoods.reduce((sum, entry) => sum + entry.mood, 0);
    avgMood = moodSum / recentMoods.length;
  }
  
  // Determine focus areas based on average mood
  let focusArea = 'balance';
  if (avgMood < 4) focusArea = 'improving mood';
  else if (avgMood > 7) focusArea = 'maintaining wellbeing';
  
  // Create date targets
  const twoWeeks = new Date();
  twoWeeks.setDate(twoWeeks.getDate() + 14);
  
  const oneMonth = new Date();
  oneMonth.setMonth(oneMonth.getMonth() + 1);
  
  return {
    title: `Personalized Wellbeing Plan: Focus on ${focusArea}`,
    description: `This plan is designed to help you develop skills and practices that support your mental health, with a particular focus on ${focusArea}.`,
    techniques: [
      {
        name: "Mindful Breathing",
        description: "Take 5 minutes to focus on your breath. Inhale for 4 counts, hold for 2, exhale for 6.",
        frequency: "Daily, preferably in the morning",
        completed: []
      },
      {
        name: "Gratitude Practice",
        description: "Write down 3 things you're grateful for, including one new thing each day.",
        frequency: "Daily, before bed",
        completed: []
      },
      {
        name: "Physical Activity",
        description: "Engage in at least 20 minutes of movement that feels good to your body.",
        frequency: "At least 3 times per week",
        completed: []
      },
      {
        name: "Social Connection",
        description: "Reach out to someone you care about, even with a quick message or call.",
        frequency: "At least twice weekly",
        completed: []
      }
    ],
    goals: [
      {
        description: "Complete at least 10 mindfulness sessions",
        targetDate: twoWeeks,
        completed: false,
        progress: 0
      },
      {
        description: "Identify 3 key triggers that impact my mood",
        targetDate: twoWeeks,
        completed: false,
        progress: 0
      },
      {
        description: "Develop a personalized set of coping strategies I can use when needed",
        targetDate: oneMonth,
        completed: false,
        progress: 0
      }
    ],
    resources: [
      {
        type: "article",
        title: "Understanding Your Emotions",
        description: "A guide to recognizing and working with difficult emotions",
        link: "",
        completed: false
      },
      {
        type: "exercise",
        title: "Progressive Muscle Relaxation",
        description: "A step-by-step technique to release physical tension",
        link: "",
        completed: false
      },
      {
        type: "video",
        title: "Introduction to Mindfulness",
        description: "A beginner-friendly guide to mindfulness practices",
        link: "",
        completed: false
      },
      {
        type: "professional",
        title: "Finding Professional Support",
        description: "Guidelines for when and how to connect with mental health professionals",
        link: "",
        completed: false
      }
    ]
  };
};