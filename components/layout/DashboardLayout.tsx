import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { LayoutDashboard, Zap, Settings } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  lastUpdated: Date | null;
  onScan: () => void;
  isScanning: boolean;
  scanProgress?: { current: number; total: number; symbol: string };
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  lastUpdated, 
  onScan, 
  isScanning,
  scanProgress 
}) => {
  return (
    <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              CryptoSignal<span className="font-light text-white">AI</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-xs text-right text-gray-500">
              <p>Data Source: Binance Futures</p>
              {lastUpdated && <p>Updated: {lastUpdated.toLocaleTimeString()}</p>}
            </div>
            
            <button 
              onClick={onScan}
              disabled={isScanning}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                ${isScanning 
                  ? 'bg-slate-700 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-95'}
              `}
            >
              <Zap size={18} className={isScanning ? 'animate-spin' : ''} />
              {isScanning ? 'Scanning...' : 'Scan Market'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isScanning && scanProgress && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
            <div 
              className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-300 ease-out"
              style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
            />
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-12">
        {isScanning && scanProgress && (
           <div className="fixed bottom-8 right-8 z-50">
             <GlassCard className="px-4 py-2 flex items-center gap-3 text-sm">
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
               <span className="text-gray-300">Scanning: <span className="text-white font-mono">{scanProgress.symbol}</span></span>
             </GlassCard>
           </div>
        )}
        
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-600 text-xs">
          <p>Powered by Binance Futures API & Ollama AI</p>
          <p className="mt-2">Trading involves substantial risk. This tool is for educational purposes only.</p>
        </div>
      </footer>
    </div>
  );
};
