
import React, { useEffect, useState, useRef } from 'react';
import CandleChart from './components/CandleChart';
import SettingsModal from './components/SettingsModal';
import HistoryModal from './components/HistoryModal';
import DecisionReport from './components/DecisionReport';
import { MarketDataCollection, AccountContext, AIDecision, SystemLog, AppConfig } from './types';
import { Settings, Play, Pause, Activity, Terminal, History, RefreshCw } from 'lucide-react';
import { DEFAULT_CONFIG } from './constants';

const App: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketDataCollection | null>(null);
  const [accountData, setAccountData] = useState<AccountContext | null>(null);
  const [decision, setDecision] = useState<AIDecision | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch Status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        setMarketData(data.marketData);
        setAccountData(data.accountData);
        setDecision(data.latestDecision);
        setLogs(data.logs);
        setIsRunning(data.isRunning);
        setConfig(data.config);
      } catch (e) {
        console.error("Fetch status failed", e);
      }
    };

    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const toggleStrategy = async () => {
    try {
      await fetch('/api/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ running: !isRunning })
      });
      setIsRunning(!isRunning);
    } catch (e) {
      console.error(e);
    }
  };

  const saveConfig = async (newConfig: AppConfig) => {
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      setConfig(newConfig);
      setIsSettingsOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-okx-bg text-okx-text font-sans selection:bg-okx-primary selection:text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-okx-border bg-okx-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-okx-up animate-pulse' : 'bg-okx-subtext'}`}></div>
            <h1 className="font-bold text-lg tracking-tight flex items-center gap-2">
              ETH 10U 战神 
              <span className="text-xs font-normal text-okx-subtext px-2 py-0.5 bg-okx-border rounded-full">Cloud Pro</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="hidden md:flex items-center gap-4 mr-4 text-xs font-mono text-okx-subtext">
                <div>
                   权益: <span className="text-white">{accountData?.balance.totalEq || '0.00'}</span>
                </div>
                <div>
                   可用: <span className="text-white">{accountData?.balance.availEq || '0.00'}</span>
                </div>
             </div>

            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 hover:bg-okx-border rounded-lg text-okx-subtext hover:text-white transition-colors flex items-center gap-2"
              title="历史回溯"
            >
              <History size={18} />
              <span className="text-xs font-bold hidden sm:block">历史推演</span>
            </button>

            <button 
              onClick={toggleStrategy}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-all ${
                isRunning 
                  ? 'bg-okx-down/10 text-okx-down hover:bg-okx-down/20' 
                  : 'bg-okx-up text-okx-bg hover:bg-okx-up/90'
              }`}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              {isRunning ? '停止策略' : '启动引擎'}
            </button>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-okx-border rounded-lg text-okx-subtext hover:text-white transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1920px] mx-auto w-full h-[calc(100vh-3.5rem)]">
        
        {/* Left Col: Chart & Logs (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-full overflow-hidden">
          {/* Chart Area */}
          <div className="flex-[3] bg-okx-card rounded-xl border border-okx-border overflow-hidden relative group">
             {marketData?.candles15m && marketData.candles15m.length > 0 ? (
                <CandleChart data={marketData.candles15m} />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-okx-subtext">
                  <Activity className="animate-pulse mr-2" /> 等待市场数据...
                </div>
             )}
             <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1.5 rounded border border-white/10 text-xs font-mono">
                <div className="text-2xl font-bold text-white mb-1">{marketData?.ticker?.last || '0.00'}</div>
                <div className="flex gap-4 text-okx-subtext">
                    <span>24H: {marketData?.ticker?.volCcy24h ? parseInt(marketData.ticker.volCcy24h).toLocaleString() : '0'}</span>
                    <span>OI: {marketData?.openInterest || '0'}</span>
                </div>
             </div>
          </div>

          {/* Logs Area */}
          <div className="flex-[1] bg-okx-card rounded-xl border border-okx-border flex flex-col min-h-[150px]">
            <div className="px-4 py-2 border-b border-okx-border bg-okx-bg/50 flex items-center gap-2">
              <Terminal size={14} className="text-okx-primary" />
              <span className="text-xs font-bold text-okx-subtext uppercase">System Logs</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 custom-scrollbar">
              {logs.length === 0 && <div className="text-okx-subtext opacity-50">System initialized. Waiting for events...</div>}
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2 hover:bg-white/5 p-0.5 rounded">
                  <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`font-bold ${
                    log.type === 'ERROR' ? 'text-okx-down' :
                    log.type === 'SUCCESS' ? 'text-okx-up' :
                    log.type === 'WARNING' ? 'text-yellow-500' :
                    log.type === 'TRADE' ? 'text-blue-400' :
                    'text-gray-300'
                  }`}>[{log.type}]</span>
                  <span className="text-gray-300">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Right Col: AI Analysis (4 cols) */}
        <div className="lg:col-span-4 bg-okx-card rounded-xl border border-okx-border flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-okx-border bg-okx-bg/50">
                <div className="flex justify-between items-center mb-1">
                    <h2 className="font-bold text-white flex items-center gap-2">
                        <Activity size={18} className="text-purple-500" />
                        AI 战神推演
                    </h2>
                    <span className="text-xs font-mono text-okx-subtext">
                        {decision?.timestamp ? new Date(decision.timestamp).toLocaleTimeString() : '--:--:--'}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                        decision?.action === 'BUY' ? 'bg-okx-up/20 text-okx-up' :
                        decision?.action === 'SELL' ? 'bg-okx-down/20 text-okx-down' :
                        'bg-gray-700 text-gray-300'
                    }`}>
                        {decision?.action || 'WAITING'}
                    </span>
                    <span className="text-okx-subtext">置信度: {decision?.trading_decision?.confidence || '0%'}</span>
                </div>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
                {decision ? (
                    <DecisionReport decision={decision} />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-okx-subtext opacity-50">
                        <div className="animate-spin mb-4"><RefreshCw size={24} /></div>
                        <p>正在连接深思引擎...</p>
                    </div>
                )}
            </div>
        </div>

      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={config}
        onSave={saveConfig}
      />
      
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};

export default App;
