
import React, { useEffect, useState, useRef } from 'react';
import CandleChart from './components/CandleChart';
import SettingsModal from './components/SettingsModal';
import HistoryModal from './components/HistoryModal';
import DecisionReport from './components/DecisionReport';
import { MarketDataCollection, AccountContext, AIDecision, SystemLog, AppConfig, PositionData } from './types';
import { Settings, Play, Pause, Activity, Terminal, History, RefreshCw, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';
import { DEFAULT_CONFIG, INSTRUMENT_ID } from './constants';

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

  const primaryPosition: PositionData | undefined = accountData?.positions.find(p => p.instId === INSTRUMENT_ID);

  return (
    <div className="h-screen bg-okx-bg text-okx-text font-sans selection:bg-okx-primary selection:text-white flex flex-col overflow-hidden">
      {/* Header (Fixed Height 3.5rem) */}
      <header className="h-14 shrink-0 border-b border-okx-border bg-okx-card/50 backdrop-blur-md z-40">
        <div className="max-w-[1920px] mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${isRunning ? 'bg-okx-up animate-pulse' : 'bg-okx-subtext'}`}></div>
            <h1 className="font-bold text-lg tracking-tight flex items-center gap-2">
              ETH 10U 战神 
              <span className="text-xs font-normal text-okx-subtext px-2 py-0.5 bg-okx-border rounded-full">Cloud Pro</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="hidden md:flex items-center gap-6 mr-6 text-xs font-mono text-okx-subtext bg-okx-bg/30 px-3 py-1.5 rounded-lg border border-okx-border/50">
                <div className="flex items-center gap-2">
                   <Wallet size={14} className="text-gray-400"/>
                   权益: <span className="text-white font-bold">{accountData?.balance.totalEq || '0.00'}</span>
                </div>
                <div className="w-px h-3 bg-gray-700"></div>
                <div>
                   可用: <span className="text-white font-bold">{accountData?.balance.availEq || '0.00'}</span>
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
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-all shadow-lg ${
                isRunning 
                  ? 'bg-okx-down/10 text-okx-down hover:bg-okx-down/20 border border-okx-down/20' 
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

      {/* Main Content (Fixed Layout) */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="max-w-[1920px] mx-auto w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-4">
        
          {/* Left Col: Chart (65%) & Logs (35%) */}
          <div className="lg:col-span-8 flex flex-col gap-4 h-full">
            {/* Chart Area */}
            <div className="h-[65%] bg-okx-card rounded-xl border border-okx-border overflow-hidden relative group shadow-lg shrink-0">
               {marketData?.candles15m && marketData.candles15m.length > 0 ? (
                  <CandleChart data={marketData.candles15m} />
               ) : (
                  <div className="w-full h-full flex items-center justify-center text-okx-subtext">
                    <Activity className="animate-pulse mr-2" /> 等待市场数据...
                  </div>
               )}
               {/* Floating Ticker Info */}
               <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-4 py-2 rounded-lg border border-white/10 text-xs font-mono shadow-xl">
                  <div className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                    {marketData?.ticker?.last || '0.00'}
                    <span className="text-xs font-normal text-okx-subtext px-1.5 py-0.5 bg-gray-800 rounded">USDT</span>
                  </div>
                  <div className="flex gap-4 text-gray-400">
                      <span className="flex items-center gap-1"><TrendingUp size={10}/> 24H: {marketData?.ticker?.volCcy24h ? (parseInt(marketData.ticker.volCcy24h)/1000000).toFixed(1) + 'M' : '0'}</span>
                      <span>OI: {marketData?.openInterest ? parseInt(marketData.openInterest).toLocaleString() : '0'}</span>
                  </div>
               </div>
            </div>

            {/* Logs Area - Fills remaining height */}
            <div className="flex-1 bg-okx-card rounded-xl border border-okx-border flex flex-col shadow-lg overflow-hidden min-h-0">
              <div className="px-4 py-2.5 border-b border-okx-border bg-okx-bg/50 flex items-center gap-2 shrink-0">
                <Terminal size={14} className="text-okx-primary" />
                <span className="text-xs font-bold text-okx-subtext uppercase tracking-wider">System Logs</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 custom-scrollbar bg-[#0c0c0e]">
                {logs.length === 0 && <div className="text-okx-subtext opacity-50 italic">System initialized. Waiting for events...</div>}
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-2 hover:bg-white/5 p-0.5 rounded leading-relaxed">
                    <span className="text-gray-600 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={`font-bold w-16 text-center shrink-0 ${
                      log.type === 'ERROR' ? 'text-okx-down' :
                      log.type === 'SUCCESS' ? 'text-okx-up' :
                      log.type === 'WARNING' ? 'text-yellow-500' :
                      log.type === 'TRADE' ? 'text-blue-400' :
                      'text-gray-400'
                    }`}>[{log.type}]</span>
                    <span className="text-gray-300 break-all">{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>

          {/* Right Col: Position Info & AI (Fixed Layout) */}
          <div className="lg:col-span-4 flex flex-col gap-4 h-full">
             
              {/* 1. Position Dashboard (Fixed Height) */}
              <div className="bg-okx-card rounded-xl border border-okx-border shadow-lg shrink-0 overflow-hidden">
                  <div className="px-4 py-3 border-b border-okx-border bg-okx-bg/30 flex justify-between items-center">
                      <div className="flex items-center gap-2 font-bold text-white text-sm">
                          <Wallet size={16} className="text-blue-500"/>
                          当前持仓 ({INSTRUMENT_ID})
                      </div>
                      {primaryPosition && (
                         <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${primaryPosition.posSide === 'long' ? 'bg-okx-up/20 text-okx-up' : 'bg-okx-down/20 text-okx-down'}`}>
                             {primaryPosition.posSide}
                         </span>
                      )}
                  </div>
                  
                  <div className="p-4">
                     {primaryPosition && parseFloat(primaryPosition.pos) > 0 ? (
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                 <div className="text-xs text-okx-subtext">持仓量 (张)</div>
                                 <div className="text-lg font-mono font-bold text-white">{primaryPosition.pos}</div>
                             </div>
                             <div className="space-y-1 text-right">
                                 <div className="text-xs text-okx-subtext">浮动盈亏 (UPL)</div>
                                 <div className={`text-lg font-mono font-bold ${parseFloat(primaryPosition.upl) >= 0 ? 'text-okx-up' : 'text-okx-down'}`}>
                                     {parseFloat(primaryPosition.upl) > 0 ? '+' : ''}{primaryPosition.upl} U
                                 </div>
                             </div>
                             
                             <div className="col-span-2 h-px bg-okx-border/50 my-1"></div>

                             <div className="space-y-1">
                                 <div className="text-xs text-okx-subtext">持仓均价 (Avg Cost)</div>
                                 <div className="text-sm font-mono text-gray-300">{primaryPosition.avgPx}</div>
                             </div>
                             <div className="space-y-1 text-right">
                                 <div className="text-xs text-okx-subtext flex items-center justify-end gap-1 text-yellow-500/80">
                                     <AlertTriangle size={10}/> 盈亏平衡价 (BE)
                                 </div>
                                 <div className="text-sm font-mono text-yellow-500 font-bold">
                                     {primaryPosition.breakEvenPx || '--'}
                                 </div>
                             </div>
                         </div>
                     ) : (
                         <div className="h-[105px] flex flex-col items-center justify-center text-okx-subtext opacity-40 gap-2">
                             <Wallet size={24} />
                             <span className="text-xs">当前无持仓 / 空仓观望</span>
                         </div>
                     )}
                  </div>
              </div>

              {/* 2. AI Report (Fills remaining space) */}
              <div className="flex-1 bg-okx-card rounded-xl border border-okx-border flex flex-col overflow-hidden shadow-lg min-h-0">
                  <div className="p-4 border-b border-okx-border bg-okx-bg/50 shrink-0">
                      <div className="flex justify-between items-center mb-1">
                          <h2 className="font-bold text-white flex items-center gap-2">
                              <Activity size={18} className="text-purple-500 animate-pulse" />
                              AI 战神推演
                          </h2>
                          <span className="text-xs font-mono text-okx-subtext bg-black/30 px-2 py-1 rounded">
                              {decision?.timestamp ? new Date(decision.timestamp).toLocaleTimeString() : '--:--:--'}
                          </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-2">
                          <span className={`px-2 py-0.5 rounded font-bold shadow-sm ${
                              decision?.action === 'BUY' ? 'bg-okx-up/20 text-okx-up border border-okx-up/30' :
                              decision?.action === 'SELL' ? 'bg-okx-down/20 text-okx-down border border-okx-down/30' :
                              decision?.action === 'UPDATE_TPSL' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                              'bg-gray-700 text-gray-300 border border-gray-600'
                          }`}>
                              {decision?.action || 'WAITING'}
                          </span>
                          <span className="text-okx-subtext ml-auto">AI置信度: <span className="text-white font-bold">{decision?.trading_decision?.confidence || '0%'}</span></span>
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-hidden relative bg-[#121214]">
                      {decision ? (
                          <DecisionReport decision={decision} />
                      ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-okx-subtext opacity-50">
                              <div className="animate-spin mb-4 text-okx-primary"><RefreshCw size={24} /></div>
                              <p className="text-xs">正在连接深思引擎...</p>
                          </div>
                      )}
                  </div>
              </div>
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
