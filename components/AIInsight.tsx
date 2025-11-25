import React from 'react';

interface AIInsightProps {
  analysis: string | null;
  isLoading: boolean;
  onGenerate: () => void;
}

const AIInsight: React.FC<AIInsightProps> = ({ analysis, isLoading, onGenerate }) => {
  return (
    <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-6 mb-6 shadow-lg relative overflow-hidden">
        {/* Background gradient decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            <i className="fas fa-robot mr-2"></i>Gemini AI Analyst
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Get intelligent market direction based on signal confluence.
          </p>
        </div>
        
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className={`mt-3 md:mt-0 px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2
            ${isLoading 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg hover:shadow-blue-500/20'
            }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <span className="text-lg">✨</span> Generate Insight
            </>
          )}
        </button>
      </div>

      {analysis && (
        <div className="bg-[#131722] rounded-lg p-4 border border-gray-800 text-gray-300 leading-relaxed animate-fade-in">
            <div className="prose prose-invert max-w-none text-sm">
                {analysis.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0">{line}</p>
                ))}
            </div>
        </div>
      )}
      
      {!analysis && !isLoading && (
        <div className="bg-[#131722]/50 border border-dashed border-gray-800 rounded-lg p-4 text-center text-gray-500 text-sm">
            Ready to analyze current market conditions. Click the button above.
        </div>
      )}
    </div>
  );
};

export default AIInsight;