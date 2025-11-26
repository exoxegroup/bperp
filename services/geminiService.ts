import { GoogleGenAI } from "@google/genai";
import { MarketSummary } from '../types';

export const analyzeMarket = async (summary: MarketSummary): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key not found. Please ensure process.env.API_KEY is set.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const totalSignals = summary.bullishCount + summary.bearishCount + summary.neutralCount;
  const bullishPercentage = ((summary.bullishCount / totalSignals) * 100).toFixed(1);
  const bearishPercentage = ((summary.bearishCount / totalSignals) * 100).toFixed(1);
  const neutralPercentage = ((summary.neutralCount / totalSignals) * 100).toFixed(1);
  
  const aPlusSignals = summary.topSetups.filter(s => s.rank === 'A+').length;
  const highConfidencePercentage = ((aPlusSignals / totalSignals) * 100).toFixed(1);

  const enhancedPrompt = `
You are a Senior Crypto Market Analyst with 10+ years experience analyzing futures markets.

Market Data Analysis:
• Bullish Signals: ${summary.bullishCount} (${bullishPercentage}%)
• Bearish Signals: ${summary.bearishCount} (${bearishPercentage}%)
• Neutral Signals: ${summary.neutralCount} (${neutralPercentage}%)
• High-Confidence (A+ Rank): ${aPlusSignals} (${highConfidencePercentage}%)

Market Context:
${summary.bullishCount > summary.bearishCount ? `📈 Bullish dominance at ${bullishPercentage}%` : summary.bearishCount > summary.bullishCount ? `📉 Bearish dominance at ${bearishPercentage}%` : `⚖️ Balanced market with ${neutralPercentage}% neutral`}

Top High-Confidence Setups (A+ Rank - Multi-Timeframe Confluence):
${summary.topSetups.filter(s => s.rank === 'A+').slice(0, 3).map(s => `• ${s.symbol}: ${s.signal} (MTF alignment confirmed)`).join('\n')}

Analysis Framework:
1. **Market Sentiment**: Determine if we're in bull/bear/choppy market
2. **Risk Assessment**: ${highConfidencePercentage}% high-confidence signals indicates ${parseFloat(highConfidencePercentage) > 20 ? 'high' : parseFloat(highConfidencePercentage) > 10 ? 'moderate' : 'low'} conviction environment  
3. **Trading Strategy**: Specific actionable advice for next 4-8 hours
4. **Key Levels**: Mention strongest setups and why they're compelling
5. **Market Timing**: Is this optimal entry or wait for better setup?

Format: 3-4 concise bullet points, max 120 words, professional tone. Include percentage context.

Example format:
• Market Sentiment: [Bullish/Bearish/Neutral] (${bullishPercentage}% vs ${bearishPercentage}%)
• Strategy: [Specific action with timeframe]
• Best Setup: [Top A+ symbol] showing [reason]
• Risk Level: [High/Med/Low] based on ${highConfidencePercentage}% A+ signals
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: enhancedPrompt,
    });
    
    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI Analyst. Please try again later.";
  }
};