import { GoogleGenAI } from '@google/genai';
import Restaurant from '../models/Restaurant.js';
import Menu from '../models/Menu.js';
import Review from '../models/Review.js';

// Initialize Gemini SDK safely
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

const isMockAI = !ai || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here';

const checkAI = (res) => {
  if (isMockAI) return false;
  return true;
};

// @desc    Chat with AI Assistant
// @route   POST /api/ai/chat
// @access  Public
export const chatWithAssistant = async (req, res, next) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    if (!checkAI(res)) {
      return res.status(200).json({
        success: true,
        data: { reply: "Hi! I see you don't have a valid Gemini API key yet. But I'd highly recommend you check out The Spice Symphony for some amazing Indian food, or Luigi's Pizzeria if you're in the mood for Italian! 🍕🍛" }
      });
    }

    // In a real app, we'd use function calling or RAG to get the right restaurants.
    // For now, we'll fetch a few top restaurants to inject as context if needed.
    const restaurants = await Restaurant.find().select('name cuisineTypes avgRating').limit(5).lean();
    
    const systemPrompt = `You are DineBot, a helpful dining assistant for DineConnect. 
You help users find restaurants, suggest dishes, and assist with bookings.
Be concise, friendly, and use emojis. 
Here are some top restaurants on our platform: ${JSON.stringify(restaurants)}
If the user asks for a recommendation, use this list.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\nUser: ' + message }] }
        ]
    });

    res.status(200).json({
      success: true,
      data: { reply: response.text }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate insights from reviews for a restaurant
// @route   GET /api/ai/insights/:restaurantId
// @access  Private (Owner only ideally, but keeping it open for demo)
export const generateReviewInsights = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const reviews = await Review.find({ restaurantId }).sort('-createdAt').limit(20).select('rating comment').lean();

    if (reviews.length === 0) {
      return res.status(200).json({ success: true, data: { insights: 'Not enough reviews to generate insights.' } });
    }

    if (!checkAI(res)) {
      return res.status(200).json({
        success: true,
        data: { insights: "• Customers love the authentic flavors and quick delivery.\n• The ambiance is highly praised by dine-in customers.\n• Some reviewers mentioned portion sizes could be slightly larger." }
      });
    }

    const prompt = `Analyze these recent reviews for a restaurant and provide a 3-bullet-point summary of the key themes. 
Highlight what customers love and what needs improvement.
Reviews: ${JSON.stringify(reviews)}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    res.status(200).json({
      success: true,
      data: { insights: response.text }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suggest an optimal combo meal
// @route   POST /api/ai/suggest-combo
// @access  Public
export const suggestCombo = async (req, res, next) => {
  try {
    const { restaurantId, partySize } = req.body;
    if (!restaurantId || !partySize) return res.status(400).json({ success: false, message: 'Restaurant ID and party size are required' });

    const menu = await Menu.find({ restaurantId, isAvailable: true }).select('name category price description isVeg').lean();
    
    if (menu.length === 0) {
      return res.status(200).json({ success: true, data: { comboText: 'This restaurant currently has no available menu items to suggest.', suggestedItems: [] } });
    }

    if (!checkAI(res)) {
      return res.status(200).json({
        success: true,
        data: {
          comboText: `Perfect! For a party of ${partySize}, I highly recommend our Chef's Special Combo which includes our most popular appetizers and a hearty main course to share!`,
          suggestedItems: menu.slice(0, 2).map(m => m.name)
        }
      });
    }

    const prompt = `You are a culinary expert. Create a well-balanced combo meal recommendation for a party of ${partySize} people from the following menu.
Return your response ONLY as a valid JSON object with the following structure:
{
  "comboText": "A short engaging paragraph explaining why this combo is perfect for the group.",
  "suggestedItems": ["Name of item 1", "Name of item 2"]
}

Menu: ${JSON.stringify(menu)}
Do not include any markdown formatting like \`\`\`json in your response. Just the raw JSON string.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    let result;
    try {
        let jsonStr = response.text.trim();
        // Fallback cleanup in case the model adds markdown
        if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.substring(7);
        if (jsonStr.endsWith('\`\`\`')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);
        result = JSON.parse(jsonStr.trim());
    } catch (e) {
        result = {
            comboText: response.text,
            suggestedItems: []
        };
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
