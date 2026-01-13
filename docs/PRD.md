# Product Requirements Document (PRD)

## 1. Introduction
**Product Name:** Crypto Signal AI Analyst
**Version:** 0.1.0 (Prototype)
**Status:** In Development

### Problem Statement
Crypto traders on Binance Perpetual Futures face information overload with over 500+ trading pairs. Manually scanning for technical setups across multiple timeframes (1m to 1w) is impossible. Traders need a tool to filter noise and identify high-probability setups instantly.

### Product Goal
Build a real-time, AI-enhanced market scanner that aggregates technical indicators across 8 timeframes, ranks signals by confluence strength (A+, A, B+), and provides generative AI summaries for actionable insights.

---

## 2. User Stories
1.  **As a Trader**, I want to scan all available USDT-Perpetual pairs on Binance so I don't miss opportunities.
2.  **As a Trader**, I want to see signals ranked by quality (e.g., "A+" for multi-timeframe alignment) so I can focus on the best setups.
3.  **As a Trader**, I want to read an AI-generated summary of the market structure so I can understand the context without analyzing 50 charts.
4.  **As a Trader**, I want to filter by specific timeframes or signal directions (Long/Short).

---

## 3. Functional Requirements

### 3.1 Data Acquisition
*   **Source:** Binance Futures Public API (`fapi.binance.com`).
*   **Assets:** All `USDT` quoted Perpetual contracts with `TRADING` status.
*   **Data Points:** Open, High, Low, Close (OHLC) for calculation.

### 3.2 Signal Logic (Existing)
*   **Timeframes:**
    *   Lower Timeframes (LTF): 1m, 5m, 15m, 30m.
    *   Higher Timeframes (HTF): 1h, 4h, 1d, 1w.
*   **Indicators:**
    *   SMA (10, 20, 50)
    *   RSI (14)
    *   MACD (12, 26, 9)
    *   Stochastic Oscillator
*   **Ranking System:**
    *   **A+**: Unanimous alignment on LTF and HTF.
    *   **A**: Unanimous on one group, max 1 dissent on the other.
    *   **B+**: Unanimous on one group, neutral on the other.

### 3.3 AI Analysis
*   **Provider:** Google Gemini (via `@google/genai`).
*   **Input:** Aggregated market stats (Bullish/Bearish counts, Top A+ setups).
*   **Output:** Textual summary of market sentiment, risk level, and top opportunities.

### 3.4 Local Storage Persistence
*   **Storage Mechanism:** Browser `localStorage`.
*   **Data Retention:** Store only the most recent scan result (overwrites previous).
*   **Schema:**
    *   `lastUpdated`: Timestamp of completion.
    *   `signals`: Array of ranked signals.
    *   `marketSummary`: AI analysis text.
*   **Behavior:**
    *   Auto-load cached results on page refresh.
    *   Display "Last Updated" timestamp prominently.
    *   Seamless transition between cached view and active scanning.

---

## 4. Technical Constraints & Current Architecture
*   **Frontend:** React 19 + Vite + TypeScript.
*   **Backend:** Express (currently only for static serving).
*   **Deployment:** Designed for PaaS (e.g., Render).

### 4.1 Identified Critical Issues (To Be Addressed)
1.  **Security:** Gemini API Key is currently exposed in client-side code (`vite.config.ts` injection). **Must be moved to backend.**
2.  **Rate Limiting:** The app fetches data for 500+ symbols * 8 timeframes from the client. This risks IP bans from Binance. **Need a proxy or caching layer.**
3.  **Performance:** Technical indicator calculations happen on the main UI thread, potentially freezing the browser during scans. **Need Web Workers or Backend processing.**

---

## 5. Future Enhancements (Roadmap)
*   **Backend Proxy:** Move API calls to a Node.js server to hide keys and manage rate limits.
*   **Caching Strategy:** Cache kline data to reduce API calls.
*   **UI/UX Overhaul:** Modern "Vibe" interface with Glassmorphism and GSAP animations (Phase 4).
*   **WebSockets:** Real-time price updates instead of polling.
