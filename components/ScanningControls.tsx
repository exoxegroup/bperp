import React from 'react';

interface ScanningControlsProps {
  currentInterval: number;
  onIntervalChange: (interval: number) => void;
  marketVolatility: number;
  confidenceRatio: number;
  isScanning: boolean;
}

const ScanningControls: React.FC<ScanningControlsProps> = ({
  currentInterval,
  onIntervalChange,
  marketVolatility,
  confidenceRatio,
  isScanning
}) => {
  const formatInterval = (ms: number) => {
    const minutes = ms / 1000 / 60;
    return `${minutes}m`;
  };

  const getVolatilityColor = (volatility: number) => {
    if (volatility > 0.4) return 'text-red-400';
    if (volatility > 0.2) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.3) return 'text-green-400';
    if (confidence > 0.15) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 mb-4 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-2">
            <i className="fas fa-cog mr-2"></i>Smart Scanning
          </h3>
          <div className="flex gap-4 text-sm text-gray-400">
            <span className={getVolatilityColor(marketVolatility)}>
              Volatility: {(marketVolatility * 100).toFixed(1)}%
            </span>
            <span className={getConfidenceColor(confidenceRatio)}>
              Confidence: {(confidenceRatio * 100).toFixed(1)}%
            </span>
            <span className="text-blue-400">
              Auto: {formatInterval(currentInterval)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onIntervalChange(5 * 60 * 1000)}
            className={`px-3 py-2 text-xs rounded-lg transition-colors ${
              currentInterval === 5 * 60 * 1000
                ? 'bg-blue-600 text-white'
                : 'bg-[#2a2e39] text-gray-300 hover:bg-[#3a3e49]'
            } ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isScanning}
            title="High frequency - 5 minutes"
          >
            <i className="fas fa-tachometer-alt mr-1"></i>5m
          </button>
          <button
            onClick={() => onIntervalChange(10 * 60 * 1000)}
            className={`px-3 py-2 text-xs rounded-lg transition-colors ${
              currentInterval === 10 * 60 * 1000
                ? 'bg-blue-600 text-white'
                : 'bg-[#2a2e39] text-gray-300 hover:bg-[#3a3e49]'
            } ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isScanning}
            title="Medium frequency - 10 minutes"
          >
            <i className="fas fa-clock mr-1"></i>10m
          </button>
          <button
            onClick={() => onIntervalChange(15 * 60 * 1000)}
            className={`px-3 py-2 text-xs rounded-lg transition-colors ${
              currentInterval === 15 * 60 * 1000
                ? 'bg-blue-600 text-white'
                : 'bg-[#2a2e39] text-gray-300 hover:bg-[#3a3e49]'
            } ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isScanning}
            title="Normal frequency - 15 minutes"
          >
            <i className="fas fa-hourglass-half mr-1"></i>15m
          </button>
          <button
            onClick={() => onIntervalChange(30 * 60 * 1000)}
            className={`px-3 py-2 text-xs rounded-lg transition-colors ${
              currentInterval === 30 * 60 * 1000
                ? 'bg-blue-600 text-white'
                : 'bg-[#2a2e39] text-gray-300 hover:bg-[#3a3e49]'
            } ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isScanning}
            title="Low frequency - 30 minutes"
          >
            <i className="fas fa-hourglass mr-1"></i>30m
          </button>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        <i className="fas fa-info-circle mr-1"></i>
        Smart scanning adjusts frequency based on market conditions. Manual override available above.
      </div>
    </div>
  );
};

export default ScanningControls;