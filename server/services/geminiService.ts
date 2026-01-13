import { GoogleGenerativeAI } from "@google/generative-ai";
import type { MarketSummary } from '../types.js';

export const analyzeMarketWithGemini = async (summary: MarketSummary): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "Gemini API Key is missing. Please check your environment variables.";
  }

  const totalSignals = summary.bullishCount + summary.bearishCount + summary.neutralCount;
  const safeTotal = totalSignals === 0 ? 1 : totalSignals;

  const bullishPercentage = ((summary.bullishCount / safeTotal) * 100).toFixed(1);
  const bearishPercentage = ((summary.bearishCount / safeTotal) * 100).toFixed(1);
  const neutralPercentage = ((summary.neutralCount / safeTotal) * 100).toFixed(1);
  
  const aPlusSignals = summary.topSetups.filter(s => s.rank === 'A+').length;
  const highConfidencePercentage = ((aPlusSignals / safeTotal) * 100).toFixed(1);

  const prompt = `
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
`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI Analyst (Gemini). Please check your API key and quotas.";
  }
};
