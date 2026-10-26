import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Target,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Info,
  Sliders,
  Award,
  Zap,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart2,
  LineChart as LineChartIcon,
  Layers,
  Edit3,
  Check,
  X,
  Shield,
  Clock,
  Radio,
  Lock,
  ExternalLink,
  ChevronRight,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';

import { TradingViewWidget } from './components/TradingViewWidget';
import { IaSignalsWidget, SignalItem } from './components/IaSignalsWidget';
import { PaywallTelegramModal } from './components/PaywallTelegramModal';
import { AdminPanel } from './components/AdminPanel/AdminPanel';

interface TradeOperation {
  id: number;
  order: number;
  asset: string;
  type: 'CALL' | 'PUT' | 'COMPRA' | 'VENDA';
  stake: number;
  payoutPercent: number; // e.g. 85% or payoff ratio
  result: 'PENDING' | 'WIN' | 'LOSS' | 'DOJI';
  profit: number;
  notes: string;
  time: string;
}

interface DailyHistory {
  date: string;
  dayNumber: number;
  startingBank: number;
  endingBank: number;
  tradesWon: number;
  tradesLost: number;
  netProfit: number;
  roiPercent: number;
}

export default function App() {
  // Navigation View: 'client' (Trade Vision IA) vs 'admin' (Painel ADM via rota /admin)
  const [viewMode, setViewMode] = useState<'client' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      return path === '/admin' || path.startsWith('/admin/') || hash === '#/admin' || hash === '#admin'
        ? 'admin'
        : 'client';
    }
    return 'client';
  });
  const [clientSubTab, setClientSubTab] = useState<'signals' | 'sheet'>('signals');

  // Sincronizar navegação por rota /admin
  useEffect(() => {
    const handleRouteSync = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || path.startsWith('/admin/') || hash === '#/admin' || hash === '#admin') {
        setViewMode('admin');
      } else {
        setViewMode('client');
      }
    };

    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);

    // Atalho exclusivo para administradores: Ctrl+Shift+A ou Cmd+Shift+A
    const handleAdminShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        window.history.pushState({}, '', '/admin');
        setViewMode('admin');
      }
    };

    window.addEventListener('keydown', handleAdminShortcut);

    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
      window.removeEventListener('keydown', handleAdminShortcut);
    };
  }, []);

  // Client Information & Server Status
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [trialMinutesLeft, setTrialMinutesLeft] = useState<number | null>(null);
  const [subscriptionDaysLeft, setSubscriptionDaysLeft] = useState<number | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [serverSettings, setServerSettings] = useState<any>({
    telegramUsername: '@tradevision_oficial',
    telegramLink: 'https://t.me/tradevision_oficial',
    subscriptionPrice: 29.90,
    paymentInstructions: 'Chave PIX: financeiro@tradevision.ai. Envie o comprovante pelo Telegram para liberação imediata!'
  });

  // Selected Asset & Timeframe (Focado em M1 - 1 Minuto)
  const [selectedAsset, setSelectedAsset] = useState('EUR/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('M1');
  const [latestAiSignal, setLatestAiSignal] = useState<SignalItem | null>(null);

  // Monitorar o estado do latestAiSignal
  const prevSignalIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!latestAiSignal || !latestAiSignal.id) return;

    if (prevSignalIdRef.current !== latestAiSignal.id) {
      prevSignalIdRef.current = latestAiSignal.id;
      const timestamp = new Date().toLocaleTimeString('pt-BR');

      console.log(
        `%c[Trade Vision IA]%c ⚡ Novo Sinal M1: %c${latestAiSignal.direction}%c em ${latestAiSignal.asset} (${latestAiSignal.confidence}%) às ${timestamp}`,
        'color: #38bdf8; font-weight: bold;',
        'color: #cbd5e1;',
        `color: ${latestAiSignal.direction === 'CALL' ? '#10b981' : '#ef4444'}; font-weight: 900; background: #0f172a; padding: 2px 6px; border-radius: 4px;`,
        'color: #94a3b8;'
      );
    }
  }, [latestAiSignal]);

  // Map asset to TradingView symbol
  const tradingViewSymbol = useMemo(() => {
    switch (selectedAsset) {
      case 'EUR/USD':
        return 'FX:EURUSD';
      case 'GBP/USD':
        return 'FX:GBPUSD';
      case 'USD/JPY':
        return 'FX:USDJPY';
      case 'BTC/USDT':
        return 'BINANCE:BTCUSDT';
      case 'ETH/USDT':
        return 'BINANCE:ETHUSDT';
      default:
        return 'FX:EURUSD';
    }
  }, [selectedAsset]);

  // Configurações da Banca e Trades
  const [initialCapital, setInitialCapital] = useState<number>(() => {
    const saved = localStorage.getItem('tradeplan_initial_bank');
    return saved ? Number(saved) : 300;
  });

  const [currentBank, setCurrentBank] = useState<number>(() => {
    const saved = localStorage.getItem('tradeplan_current_bank');
    return saved ? Number(saved) : 300;
  });

  // Modal de Edição de Banca
  const [isEditBankModalOpen, setIsEditBankModalOpen] = useState(false);
  const [editBankInputValue, setEditBankInputValue] = useState(300);
  const [recalcTradesOnBankChange, setRecalcTradesOnBankChange] = useState(true);

  // Sistema de Notificações / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  useEffect(() => {
    setEditBankInputValue(currentBank);
  }, [currentBank]);

  // Modo de Gestão de Risco
  const [riskModel, setRiskModel] = useState<'FIXED_PERCENT' | 'FIXED_VALUE' | 'SOROS_LEVEL_2'>('FIXED_PERCENT');
  const [riskPercentPerTrade, setRiskPercentPerTrade] = useState<number>(2.5);
  const [fixedStakeValue, setFixedStakeValue] = useState<number>(10);
  const [defaultPayout, setDefaultPayout] = useState<number>(85);

  // Limites Diários
  const [stopWinPercent, setStopWinPercent] = useState<number>(10);
  const [stopLossPercent, setStopLossPercent] = useState<number>(6);
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState<number>(3);

  // As 5 Operações do Dia
  const [dayNumber, setDayNumber] = useState<number>(() => {
    const saved = localStorage.getItem('tradeplan_day_number');
    return saved ? Number(saved) : 1;
  });

  const defaultTrades = (): TradeOperation[] => {
    const stake = riskModel === 'FIXED_PERCENT'
      ? Math.max(2, Number(((currentBank * riskPercentPerTrade) / 100).toFixed(2)))
      : fixedStakeValue;

    return Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      order: i + 1,
      asset: selectedAsset,
      type: 'COMPRA',
      stake: stake,
      payoutPercent: defaultPayout,
      result: 'PENDING',
      profit: 0,
      notes: '',
      time: '--:--'
    }));
  };

  const [trades, setTrades] = useState<TradeOperation[]>(() => {
    const saved = localStorage.getItem('tradeplan_current_trades');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return defaultTrades();
  });

  // Histórico de Dias Concluídos
  const [history, setHistory] = useState<DailyHistory[]>(() => {
    const saved = localStorage.getItem('tradeplan_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Visualização do Gráfico do Histórico: 'area' ou 'bar'
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Fetch client status from backend (checks 24h trial and 30d subscription)
  const fetchClientStatus = async () => {
    try {
      const res = await fetch('/api/client/status?identifier=TV-8821');
      if (res.ok) {
        const data = await res.json();
        setClientProfile(data.client);
        setTrialMinutesLeft(data.trialMinutesLeft ?? null);
        setSubscriptionDaysLeft(data.subscriptionDaysLeft ?? null);
        if (data.settings) {
          setServerSettings(data.settings);
        }

        // If client is expired, trigger paywall automatically
        if (data.client?.status === 'Expirado' || data.client?.status === 'Aguardando pagamento') {
          setIsPaywallOpen(true);
        }
      }
    } catch (err) {
      console.log('Server client status check (offline/dev fallback):', err);
    }
  };

  useEffect(() => {
    fetchClientStatus();
  }, []);

  // Salvar no localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem('tradeplan_initial_bank', initialCapital.toString());
    localStorage.setItem('tradeplan_current_bank', currentBank.toString());
    localStorage.setItem('tradeplan_day_number', dayNumber.toString());
    localStorage.setItem('tradeplan_current_trades', JSON.stringify(trades));
    localStorage.setItem('tradeplan_history', JSON.stringify(history));
  }, [initialCapital, currentBank, dayNumber, trades, history]);

  // Função central para alterar o valor da banca e recalcular trades
  const handleApplyBankValue = (newVal: number, shouldRecalculate = true) => {
    if (isNaN(newVal) || newVal <= 0) return;
    const cleanVal = Number(newVal.toFixed(2));
    setCurrentBank(cleanVal);
    setInitialCapital(cleanVal);
    setEditBankInputValue(cleanVal);

    if (shouldRecalculate) {
      const calculatedStake = riskModel === 'FIXED_PERCENT'
        ? Math.max(2, Number(((cleanVal * riskPercentPerTrade) / 100).toFixed(2)))
        : fixedStakeValue;

      setTrades((prev) =>
        prev.map((trade) => {
          if (trade.result === 'PENDING') {
            return {
              ...trade,
              stake: calculatedStake
            };
          }
          return trade;
        })
      );
    }

    setIsEditBankModalOpen(false);
    showToast(`Banca atualizada para R$ ${cleanVal.toFixed(2)} com sucesso!`);
  };

  // Cálculos do dia atual
  const executedTrades = trades.filter((t) => t.result !== 'PENDING');
  const winsCount = trades.filter((t) => t.result === 'WIN').length;
  const lossesCount = trades.filter((t) => t.result === 'LOSS').length;
  const dojiCount = trades.filter((t) => t.result === 'DOJI').length;

  const currentDayNetProfit = useMemo(() => {
    return trades.reduce((acc, t) => acc + (t.result !== 'PENDING' ? t.profit : 0), 0);
  }, [trades]);

  const targetStopWinVal = (currentBank * stopWinPercent) / 100;
  const targetStopLossVal = -((currentBank * stopLossPercent) / 100);

  const stopWinReached = currentDayNetProfit >= targetStopWinVal && targetStopWinVal > 0;
  const stopLossReached = currentDayNetProfit <= targetStopLossVal;

  const consecutiveLosses = useMemo(() => {
    let maxStreak = 0;
    let curr = 0;
    for (const t of trades) {
      if (t.result === 'LOSS') {
        curr++;
        if (curr > maxStreak) maxStreak = curr;
      } else if (t.result === 'WIN') {
        curr = 0;
      }
    }
    return maxStreak;
  }, [trades]);

  const hitConsecutiveLossLimit = consecutiveLosses >= maxConsecutiveLosses;

  // Atualizar resultado de um trade
  const handleSetResult = (order: number, res: 'WIN' | 'LOSS' | 'DOJI' | 'PENDING') => {
    setTrades((prev) =>
      prev.map((trade) => {
        if (trade.order !== order) return trade;

        let profit = 0;
        if (res === 'WIN') {
          profit = Number(((trade.stake * trade.payoutPercent) / 100).toFixed(2));
        } else if (res === 'LOSS') {
          profit = -trade.stake;
        } else if (res === 'DOJI') {
          profit = 0;
        }

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        return {
          ...trade,
          result: res,
          profit,
          time: res !== 'PENDING' ? timeStr : '--:--'
        };
      })
    );
  };

  const handleUpdateTradeParam = (order: number, field: keyof TradeOperation, value: any) => {
    setTrades((prev) =>
      prev.map((trade) => {
        if (trade.order !== order) return trade;

        const updated = { ...trade, [field]: value };
        if (field === 'stake' || field === 'payoutPercent') {
          if (updated.result === 'WIN') {
            updated.profit = Number(((updated.stake * updated.payoutPercent) / 100).toFixed(2));
          } else if (updated.result === 'LOSS') {
            updated.profit = -updated.stake;
          }
        }
        return updated;
      })
    );
  };

  // Copiar sinal da IA diretamente para o próximo trade pendente da planilha
  const handleCopySignalToSheet = (signal: SignalItem) => {
    const nextPending = trades.find((t) => t.result === 'PENDING');
    if (!nextPending) {
      showToast('Todas as 5 operações de hoje já foram realizadas! Encerre o dia ou zere o placar.');
      return;
    }

    setTrades((prev) =>
      prev.map((t) => {
        if (t.order === nextPending.order) {
          return {
            ...t,
            asset: signal.asset,
            type: signal.direction === 'CALL' ? 'COMPRA' : 'VENDA',
            notes: `Sinal IA (${signal.confidence}%)`
          };
        }
        return t;
      })
    );

    setClientSubTab('sheet');
    showToast(`Sinal da IA aplicado na Operação #${nextPending.order} (${signal.asset} - ${signal.direction})!`);
  };

  // Finalizar o Dia e Registrar no Histórico
  const handleFinishDay = () => {
    if (executedTrades.length === 0) {
      showToast('Nenhuma operação foi concluída hoje ainda.');
      return;
    }

    const endingBank = Number((currentBank + currentDayNetProfit).toFixed(2));
    const roi = Number(((currentDayNetProfit / currentBank) * 100).toFixed(2));

    const dayRecord: DailyHistory = {
      date: new Date().toLocaleDateString('pt-BR'),
      dayNumber: dayNumber,
      startingBank: currentBank,
      endingBank: endingBank,
      tradesWon: winsCount,
      tradesLost: lossesCount,
      netProfit: Number(currentDayNetProfit.toFixed(2)),
      roiPercent: roi
    };

    setHistory([dayRecord, ...history]);
    setCurrentBank(endingBank);
    setDayNumber((prev) => prev + 1);

    const newStake = riskModel === 'FIXED_PERCENT'
      ? Math.max(2, Number(((endingBank * riskPercentPerTrade) / 100).toFixed(2)))
      : fixedStakeValue;

    setTrades(
      Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        order: i + 1,
        asset: selectedAsset,
        type: 'COMPRA',
        stake: newStake,
        payoutPercent: defaultPayout,
        result: 'PENDING',
        profit: 0,
        notes: '',
        time: '--:--'
      }))
    );

    showToast(`Dia #${dayNumber} encerrado com sucesso! Salvo no histórico.`);
  };

  // Zerar todo o placar do dia
  const handleResetDailyScoreboard = () => {
    const stake = riskModel === 'FIXED_PERCENT'
      ? Math.max(2, Number(((currentBank * riskPercentPerTrade) / 100).toFixed(2)))
      : fixedStakeValue;

    setTrades(
      Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        order: i + 1,
        asset: selectedAsset,
        type: 'COMPRA',
        stake: stake,
        payoutPercent: defaultPayout,
        result: 'PENDING',
        profit: 0,
        notes: '',
        time: '--:--'
      }))
    );

    showToast('Placar do dia zerado com sucesso! Todas as 5 operações estão prontas.');
  };

  // Dados formatados para o Recharts
  const chartData = useMemo(() => {
    const sorted = [...history].sort((a, b) => a.dayNumber - b.dayNumber);
    const initialPoint = {
      dayLabel: 'Início',
      dayNumber: 0,
      date: 'Banca Base',
      bank: initialCapital,
      profit: 0,
      roi: 0,
      placar: '-'
    };
    const points = sorted.map((h) => ({
      dayLabel: `Dia #${h.dayNumber}`,
      dayNumber: h.dayNumber,
      date: h.date,
      bank: h.endingBank,
      profit: h.netProfit,
      roi: h.roiPercent,
      placar: `${h.tradesWon}W - ${h.tradesLost}L`
    }));
    return [initialPoint, ...points];
  }, [history, initialCapital]);

  // Request payment / claim from Telegram
  const handleRequestTelegramPayment = async () => {
    try {
      const res = await fetch('/api/client/request-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientProfile?.id || 'cli-1',
          clientEmail: clientProfile?.email || 'rafaelbank2020@gmail.com',
          clientCode: clientProfile?.accessCode || 'TV-8821',
          clientName: clientProfile?.name || 'Rafael Silva'
        })
      });
      const data = await res.json();
      return { success: res.ok, message: data.message };
    } catch {
      return { success: false, message: 'Erro ao registrar solicitação no servidor.' };
    }
  };

  // Redeem token
  const handleRedeemToken = async (tokenCode: string) => {
    try {
      const res = await fetch('/api/client/redeem-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenCode,
          clientId: clientProfile?.id || 'cli-1'
        })
      });
      const data = await res.json();
      if (res.ok) {
        fetchClientStatus();
        setIsPaywallOpen(false);
        showToast(data.message);
      }
      return { success: res.ok, message: data.message || data.error };
    } catch {
      return { success: false, message: 'Erro de conexão com o servidor.' };
    }
  };

  // -------------------------------------------------------------
  // RENDER: PAINEL ADMINISTRATIVO (If viewMode === 'admin')
  // -------------------------------------------------------------
  if (viewMode === 'admin') {
    return (
      <AdminPanel
        onExitToClientApp={() => {
          setViewMode('client');
          window.history.pushState({}, '', '/');
        }}
        onRefreshData={fetchClientStatus}
      />
    );
  }

  // -------------------------------------------------------------
  // RENDER: CLIENT APPLICATION (Trade Vision IA)
  // -------------------------------------------------------------
  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white ${
      clientSubTab === 'signals' ? 'h-screen max-h-screen overflow-hidden' : 'pb-12'
    }`}>
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black">
              <TrendingUp className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-tight">Trade Vision IA</span>
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  PRO V4.2
                </span>

                {/* Trial or Subscription Status Badge */}
                {clientProfile?.status === 'Assinatura ativa' ? (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Assinatura Ativa</span>
                  </span>
                ) : clientProfile?.status === 'Em teste' ? (
                  <button
                    onClick={() => setIsPaywallOpen(true)}
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Teste 24h: {trialMinutesLeft !== null ? `${Math.floor(trialMinutesLeft / 60)}h ${trialMinutesLeft % 60}m` : 'Ativo'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsPaywallOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-pink-600/30 text-pink-300 border border-pink-500/50 hover:bg-pink-600/40 cursor-pointer animate-pulse"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Acesso Expirado (R$ 29,90)</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                Sinais da IA em tempo real, gráfico TradingView e planilha de metas diárias
              </p>
            </div>
          </div>

          {/* Navigation Right: Switch to Admin Panel + Sub-tabs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Sub-Tabs (Signals vs Sheet) */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
              <button
                onClick={() => setClientSubTab('signals')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  clientSubTab === 'signals'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Gráfico & Sinais
              </button>
              <button
                onClick={() => setClientSubTab('sheet')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  clientSubTab === 'sheet'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Minha Planilha
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className={`w-full flex-1 flex flex-col min-h-0 ${
        clientSubTab === 'signals'
          ? 'h-[calc(100vh-4rem)] p-2 sm:p-2.5 overflow-hidden'
          : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6'
      }`}>
        {/* Banner de Alerta Crítico (Stop Win / Stop Loss / 3 Losses) */}
        {stopWinReached && (
          <div className="p-3 sm:p-4 rounded-xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-100 flex items-start sm:items-center justify-between gap-4 shadow-xl shadow-emerald-950/50 animate-pulse shrink-0">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-emerald-300">
                  🎯 PARABÉNS! META DE STOP WIN BATIDA HOJE (+R$ {currentDayNetProfit.toFixed(2)})!
                </h4>
                <p className="text-xs text-emerald-200/80">
                  Disciplina é saber a hora de parar. Feche o gráfico e proteja o lucro da sua banca.
                </p>
              </div>
            </div>
            <button
              onClick={handleFinishDay}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shrink-0 shadow cursor-pointer"
            >
              Concluir Dia
            </button>
          </div>
        )}

        {stopLossReached && (
          <div className="p-3 sm:p-4 rounded-xl bg-red-950/90 border-2 border-red-500 text-red-100 flex items-start sm:items-center justify-between gap-4 shadow-xl shadow-red-950/50 shrink-0">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-red-300">
                  🛑 ATENÇÃO: LIMITE DE STOP LOSS DIÁRIO ATINGIDO ({currentDayNetProfit.toFixed(2)} R$)!
                </h4>
                <p className="text-xs text-red-200/80">
                  Pare imediatamente. Não tente recuperar hoje. O stop loss protege seu capital vivo.
                </p>
              </div>
            </div>
            <button
              onClick={handleFinishDay}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shrink-0 shadow cursor-pointer"
            >
              Fechar Diário
            </button>
          </div>
        )}

        {/* Client Sub-Tab 1: Gráfico Grande TradingView & IA CALL / PUT sem rolagem na tela */}
        {clientSubTab === 'signals' && (
          <div className="flex-1 w-full h-full flex flex-col min-h-0 space-y-2 overflow-hidden">
            {/* HUD Bar Superior: Seletor de Ativos + Sinal da IA (CALL/PUT) + Timer M1 + Aplicar Planilha */}
            <IaSignalsWidget
              currentAsset={selectedAsset}
              onSelectAsset={(asset) => setSelectedAsset(asset)}
              onCopySignalToSheet={handleCopySignalToSheet}
              onSignalUpdate={(sig: SignalItem) => setLatestAiSignal(sig)}
            />

            {/* Gráfico Grande TradingView 100% Limpo e Desobstruído */}
            <div className="flex-1 w-full min-h-0 overflow-hidden">
              <TradingViewWidget
                symbol={tradingViewSymbol}
                theme="dark"
                interval="1"
                height="100%"
              />
            </div>
          </div>
        )}

        {/* Client Sub-Tab 2: Minha Planilha (Gestão das 5 Operações) */}
        {clientSubTab === 'sheet' && (
          <div className="space-y-6">
            {/* Banner Informativo do Sinal Ativo da IA na Planilha */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold uppercase">Sinal Ativo da IA (M1):</span>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                      latestAiSignal?.direction === 'CALL'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}>
                      {latestAiSignal?.asset || selectedAsset} • {latestAiSignal?.direction === 'CALL' ? 'COMPRA (CALL) ▲' : 'VENDA (PUT) ▼'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ({latestAiSignal?.confidence || 92.4}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Análise em tempo real de velas de 1 minuto pronta para operação.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClientSubTab('signals')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ver no Gráfico</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Top Cards: Banca, P&L, Placar, Metas */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Banca Atual com Edição Rápida */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2.5 relative overflow-hidden group">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Banca em Operação</span>
                  </span>
                  <button
                    onClick={() => {
                      setEditBankInputValue(currentBank);
                      setIsEditBankModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-[11px] font-bold transition-all cursor-pointer"
                    title="Editar valor da banca"
                  >
                    <Edit3 className="w-3 h-3 text-emerald-400" />
                    <span>Alterar</span>
                  </button>
                </div>

                <div className="text-3xl font-black text-white tracking-tight">
                  R$ {(currentBank + currentDayNetProfit).toFixed(2)}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-500">Início do Dia #{dayNumber}:</span>
                  <span className="font-semibold text-slate-300">R$ {currentBank.toFixed(2)}</span>
                </div>

                {/* Chips de Atalhos de Banca */}
                <div className="flex items-center gap-1 pt-1 overflow-x-auto">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mr-0.5">Atalhos:</span>
                  {[100, 300, 500, 1000, 2000].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleApplyBankValue(val, true)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                        Math.round(currentBank) === val
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      R${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card 2: Resultado do Dia (P&L) */}
              <div className={`p-5 rounded-2xl border shadow-lg space-y-2 ${
                currentDayNetProfit > 0
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : currentDayNetProfit < 0
                  ? 'bg-red-950/30 border-red-500/40'
                  : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
                  <span className={currentDayNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    Lucro/Prejuízo Hoje
                  </span>
                  {currentDayNetProfit >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className={`text-3xl font-black tracking-tight ${
                  currentDayNetProfit > 0
                    ? 'text-emerald-400'
                    : currentDayNetProfit < 0
                    ? 'text-red-400'
                    : 'text-white'
                }`}>
                  {currentDayNetProfit >= 0 ? '+' : ''}R$ {currentDayNetProfit.toFixed(2)}
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-500">Rentabilidade Diária:</span>
                  <span className={`font-bold ${
                    currentDayNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {currentBank > 0 ? ((currentDayNetProfit / currentBank) * 100).toFixed(2) : 0}%
                  </span>
                </div>
              </div>

              {/* Card 3: Placar das 5 Operações com Zerar Placar */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <span>Placar do Dia (5 Max)</span>
                  <button
                    type="button"
                    onClick={handleResetDailyScoreboard}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/40 text-[11px] font-bold transition-all cursor-pointer active:scale-95"
                    title="Zerar placar do dia"
                  >
                    <RotateCcw className="w-3 h-3 text-red-400" />
                    <span>Zerar</span>
                  </button>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400">{winsCount}W</span>
                  <span className="text-2xl font-bold text-slate-500">x</span>
                  <span className="text-3xl font-black text-red-400">{lossesCount}L</span>
                  {dojiCount > 0 && <span className="text-sm font-semibold text-slate-400">({dojiCount}E)</span>}
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-500">Progresso do Dia:</span>
                  <span className="font-semibold text-slate-300">{executedTrades.length} / 5 Feitas</span>
                </div>
              </div>

              {/* Card 4: Alvos de Stop Win e Stop Loss */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <span>Metas & Paradas</span>
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Stop Win (+{stopWinPercent}%)</span>
                    <span className="text-sm font-black text-emerald-400">+R$ {targetStopWinVal.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Stop Loss (-{stopLossPercent}%)</span>
                    <span className="text-sm font-black text-red-400">-R$ {Math.abs(targetStopLossVal).toFixed(2)}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, (winsCount / 5) * 100))}%` }}
                  />
                  <div
                    className="bg-red-500 h-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, (lossesCount / 5) * 100))}%` }}
                  />
                </div>
              </div>
            </section>

            {/* Diário das 5 Operações do Dia */}
            <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-white">
                      Minha Planilha • Dia #{dayNumber}
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded-md">
                      5 Operações por Dia
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Registre os resultados em 1 clique. Conectado ao banco de dados e protegido por autenticação.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetDailyScoreboard}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-200 hover:text-red-300 border border-slate-700 hover:border-red-800/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Zerar todo o placar e resultados do dia atual"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                    <span>Zerar Todo Placar</span>
                  </button>

                  <button
                    onClick={handleFinishDay}
                    disabled={executedTrades.length === 0}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Encerrar Dia e Salvar Histórico</span>
                  </button>
                </div>
              </div>

              {/* Cards das 5 Operações */}
              <div className="grid grid-cols-1 gap-3.5">
                {trades.map((trade) => {
                  const isWin = trade.result === 'WIN';
                  const isLoss = trade.result === 'LOSS';
                  const isDoji = trade.result === 'DOJI';
                  const isPending = trade.result === 'PENDING';

                  return (
                    <div
                      key={trade.order}
                      className={`p-4 rounded-xl border transition-all ${
                        isWin
                          ? 'bg-emerald-950/20 border-emerald-500/50 shadow-sm shadow-emerald-950/30'
                          : isLoss
                          ? 'bg-red-950/20 border-red-500/50 shadow-sm shadow-red-950/30'
                          : isDoji
                          ? 'bg-slate-800/40 border-slate-700'
                          : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-750'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                              isWin
                                ? 'bg-emerald-500 text-slate-950'
                                : isLoss
                                ? 'bg-red-500 text-white'
                                : isDoji
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            #{trade.order}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={trade.asset}
                                onChange={(e) => handleUpdateTradeParam(trade.order, 'asset', e.target.value.toUpperCase())}
                                className="bg-slate-900 border border-slate-700/80 rounded px-2 py-0.5 text-xs font-bold text-white w-24 uppercase focus:border-emerald-500 outline-none"
                                placeholder="Ativo"
                              />
                              <select
                                value={trade.type}
                                onChange={(e) => handleUpdateTradeParam(trade.order, 'type', e.target.value)}
                                className="bg-slate-900 border border-slate-700/80 rounded px-2 py-0.5 text-xs font-semibold text-slate-200 outline-none"
                              >
                                <option value="COMPRA">CALL / COMPRA</option>
                                <option value="VENDA">PUT / VENDA</option>
                              </select>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Horário: <span className="font-mono text-slate-300">{trade.time}</span>
                            </div>
                          </div>
                        </div>

                        {/* Parâmetros da Operação */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                              Entrada
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs text-slate-500 font-bold">R$</span>
                              <input
                                type="number"
                                step="0.5"
                                value={trade.stake}
                                onChange={(e) =>
                                  handleUpdateTradeParam(trade.order, 'stake', Math.max(0, Number(e.target.value)))
                                }
                                className="w-20 bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs font-extrabold text-white outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                              Payout
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                type="number"
                                value={trade.payoutPercent}
                                onChange={(e) =>
                                  handleUpdateTradeParam(trade.order, 'payoutPercent', Number(e.target.value))
                                }
                                className="w-16 bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs font-extrabold text-white outline-none focus:border-emerald-500"
                              />
                              <span className="text-xs text-slate-500 font-bold">%</span>
                            </div>
                          </div>

                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                              Retorno Líquido
                            </span>
                            <div
                              className={`text-sm font-extrabold mt-1 ${
                                isWin
                                  ? 'text-emerald-400'
                                  : isLoss
                                  ? 'text-red-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {isWin ? `+R$ ${trade.profit.toFixed(2)}` : isLoss ? `-R$ ${trade.stake.toFixed(2)}` : 'R$ 0,00'}
                            </div>
                          </div>
                        </div>

                        {/* Botões de Ação WIN / LOSS */}
                        <div className="flex items-center gap-1.5 self-end lg:self-center">
                          <button
                            onClick={() => handleSetResult(trade.order, 'WIN')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                              isWin
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                                : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            WIN
                          </button>

                          <button
                            onClick={() => handleSetResult(trade.order, 'LOSS')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                              isLoss
                                ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                                : 'bg-red-950/40 text-red-400 border border-red-800/60 hover:bg-red-900/60'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            LOSS
                          </button>

                          <button
                            onClick={() => handleSetResult(trade.order, 'DOJI')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isDoji
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            EMPATE
                          </button>

                          {!isPending && (
                            <button
                              onClick={() => handleSetResult(trade.order, 'PENDING')}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                              title="Limpar resultado"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Gráfico Recharts da Curva de Capital */}
            {history.length > 0 && (
              <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <LineChartIcon className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-extrabold text-base text-white">Evolução da Minha Banca</h3>
                  </div>
                  <span className="text-xs text-slate-400">{history.length} dias concluídos</span>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="clientBankGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="dayLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                                <div className="font-bold text-white">{d.dayLabel} ({d.date})</div>
                                <div className="font-black text-emerald-400">Banca: R$ {Number(d.bank).toFixed(2)}</div>
                                {d.dayNumber > 0 && (
                                  <div className="text-slate-300">Lucro: {d.profit >= 0 ? '+' : ''}R$ {Number(d.profit).toFixed(2)}</div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area type="monotone" dataKey="bank" stroke="#10b981" strokeWidth={3} fill="url(#clientBankGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Modal: Editar Banca */}
      {isEditBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 font-bold" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Editar Valor da Banca</h3>
                  <p className="text-xs text-slate-400">Personalize seu capital operacional</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditBankModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-semibold block">Valores Populares:</span>
              <div className="grid grid-cols-4 gap-2">
                {[100, 200, 300, 500, 1000, 2000, 5000, 10000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setEditBankInputValue(val)}
                    className={`py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      editBankInputValue === val
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    R$ {val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold block">
                Ou Digite Qualquer Outro Valor (R$):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  step="1"
                  min="10"
                  value={editBankInputValue}
                  onChange={(e) => setEditBankInputValue(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base font-extrabold text-white outline-none"
                  placeholder="Ex: 100, 300, 1000"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditBankModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleApplyBankValue(editBankInputValue, recalcTradesOnBankChange)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Nova Banca</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paywall & Telegram Payment Modal (Exibido quando teste 24h ou assinatura de 30d vence) */}
      <PaywallTelegramModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        clientName={clientProfile?.name || 'Rafael Silva'}
        clientEmail={clientProfile?.email || 'rafaelbank2020@gmail.com'}
        clientCode={clientProfile?.accessCode || 'TV-8821'}
        clientId={clientProfile?.id || 'cli-1'}
        subscriptionPrice={serverSettings?.subscriptionPrice || 29.90}
        telegramLink={serverSettings?.telegramLink || 'https://t.me/tradevision_oficial'}
        telegramUsername={serverSettings?.telegramUsername || '@tradevision_oficial'}
        paymentInstructions={serverSettings?.paymentInstructions}
        onRequestPayment={handleRequestTelegramPayment}
        onRedeemToken={handleRedeemToken}
        isPendingPayment={clientProfile?.status === 'Aguardando pagamento'}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border border-emerald-500/60 text-white shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-100">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
