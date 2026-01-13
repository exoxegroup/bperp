import axios from 'axios';
export const analyzeMarket = async (summary) => {
    // Use OLLAMA_HOST from env or default to localhost
    // Remove trailing slash if present
    const host = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '');
    const model = process.env.OLLAMA_MODEL || 'mistral'; // Default model
    const apiKey = process.env.OLLAMA_API_KEY;
    const totalSignals = summary.bullishCount + summary.bearishCount + summary.neutralCount;
    // Prevent division by zero
    const safeTotal = totalSignals === 0 ? 1 : totalSignals;
    const bullishPercentage = ((summary.bullishCount / safeTotal) * 100).toFixed(1);
    const bearishPercentage = ((summary.bearishCount / safeTotal) * 100).toFixed(1);
    const neutralPercentage = ((summary.neutralCount / safeTotal) * 100).toFixed(1);
    const aPlusSignals = summary.topSetups.filter(s => s.rank === 'A+').length;
    const highConfidencePercentage = ((aPlusSignals / safeTotal) * 100).toFixed(1);
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
        const headers = {
            'Content-Type': 'application/json',
        };
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
        console.log(`Connecting to Ollama at ${host} with model ${model}...`);
        // Using /api/chat endpoint
        const response = await axios.post(`${host}/api/chat`, {
            model: model,
            messages: [{ role: 'user', content: enhancedPrompt }],
            stream: false
        }, { headers, timeout: 30000 }); // 30s timeout
        if (response.data && response.data.message && response.data.message.content) {
            return response.data.message.content;
        }
        else {
            console.error("Unexpected Ollama response format:", response.data);
            return "Ollama returned an unexpected response format.";
        }
    }
    catch (error) {
        console.error("Ollama API Error:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
        return "Error connecting to AI Analyst (Ollama). Please check if Ollama is running and the model is pulled.";
    }
};
