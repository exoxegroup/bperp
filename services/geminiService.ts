import { GoogleGenAI } from "@google/genai";
import { MarketSummary } from '../types';

export const analyzeMarket = async (summary: MarketSummary): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key not found. Please ensure process.env.API_KEY is set.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are a professional Senior Crypto Market Analyst.
    
    Analyze the following aggregation of technical signals from a futures scanner:
    - Total Bullish Signals: ${summary.bullishCount}
    - Total Bearish Signals: ${summary.bearishCount}
    - Total Neutral Signals: ${summary.neutralCount}
    
    Top High-Confidence Setups (Ranked A+ or A):
    ${summary.topSetups.map(s => `- ${s.symbol}: ${s.signal} (Rank: ${s.rank})`).join('\n')}
    
    Task:
    1. Determine the overall market sentiment (Bullish, Bearish, or Choppy/Neutral).
    2. Provide a strategic recommendation for a trader (e.g., "Look for long entries on pullbacks", "Stay in cash", "Short rallies").
    3. Specifically mention the best 1-2 symbols from the setups list and why they might be interesting based on the "A+" rank implying multi-timeframe confluence.
    
    Keep the response concise (under 150 words), professional, and actionable. Do not use financial advice disclaimers; assume this is for educational simulation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI Analyst. Please try again later.";
  }
};