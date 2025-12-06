
export const INSTRUMENT_ID = "ETH-USDT-SWAP";
// OKX V5 规范: ETH-USDT-SWAP 1张合约 = 0.1 ETH
// 注意: 实际交易前请核对 OKX 文档，部分币种为 0.01 或 10 USD
export const CONTRACT_VAL_ETH = 0.1;

// 费率设定 (保守估计 Taker 0.05%)
export const TAKER_FEE_RATE = 0.0005; 

export const DEFAULT_CONFIG = {
  okxApiKey: "",
  okxSecretKey: "",
  okxPassphrase: "",
  deepseekApiKey: "", // Renamed
  isSimulation: true, 
};

// 10U 战神策略阶段定义
export const STRATEGY_STAGES = {
  STAGE_1: {
    name: "起步期 (高风险搏杀)", // 改名：强调激进
    max_equity: 20,
    leverage: 20, // 保持高杠杆
    risk_factor: 0.8, // 激进仓位: 使用 80% 的可用余额 (High Risk High Reward)
    allow_pyramiding: true, 
    pyramid_condition: "profit_only", 
  },
  STAGE_2: {
    name: "滚仓期 (资金积累)",
    max_equity: 80,
    leverage: 10,
    risk_factor: 0.5, // 动态仓位: 使用 50% 的可用余额
  },
  STAGE_3: {
    name: "稳健期 (模式转型)",
    min_equity: 80,
    leverage: 5,
    split_parts: 8, // 资金分成8份
  }
};

export const MOCK_TICKER = {
  instId: INSTRUMENT_ID,
  last: "3250.50",
  lastSz: "1.2",
  askPx: "3250.60",
  bidPx: "3250.40",
  open24h: "3100.00",
  high24h: "3300.00",
  low24h: "3050.00",
  volCcy24h: "500000000",
  ts: Date.now().toString(),
};
