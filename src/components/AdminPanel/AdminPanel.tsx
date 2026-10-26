import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Send,
  Key,
  Target,
  FileText,
  Radio,
  LogOut,
  Shield,
  Menu,
  X,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  AlertTriangle,
  UserCheck,
  UserX,
  DollarSign,
  Calendar,
  Check,
  Activity,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import {
  ClientUser,
  PaymentRequest,
  AccessToken,
  AppSettings,
  AuditLog,
  AdminUser
} from '../../../server';

interface AdminPanelProps {
  onExitToClientApp: () => void;
  onRefreshData?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExitToClientApp, onRefreshData }) => {
  // Authentication State
  const [adminSession, setAdminSession] = useState<{
    token: string;
    admin: { id: string; name: string; email: string; role: string; permissions: string[] };
  } | null>(() => {
    const saved = localStorage.getItem('tradevision_admin_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loginEmail, setLoginEmail] = useState('rafaelbank2020@gmail.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab: 'dashboard' | 'clients' | 'payments' | 'telegram' | 'tokens' | 'goals' | 'reports' | 'market-api'
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'clients' | 'payments' | 'telegram' | 'tokens' | 'goals' | 'reports' | 'market-api'
  >('dashboard');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data States loaded from server API
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [marketApiInfo, setMarketApiInfo] = useState<any>(null);

  // Filter States
  const [clientSearch, setClientSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('Todos');
  const [selectedClientForModal, setSelectedClientForModal] = useState<ClientUser | null>(null);

  // Telegram Settings Form State
  const [telegramUsername, setTelegramUsername] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState(29.90);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // New Client Modal State
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientStatus, setNewClientStatus] = useState<'Em teste' | 'Assinatura ativa'>('Em teste');

  // Token Generator Modal State
  const [isAddTokenModalOpen, setIsAddTokenModalOpen] = useState(false);
  const [newTokenCode, setNewTokenCode] = useState('');
  const [newTokenDuration, setNewTokenDuration] = useState(30);
  const [newTokenMaxUses, setNewTokenMaxUses] = useState(1);
  const [newTokenNotes, setNewTokenNotes] = useState('');

  // Market API Form State
  const [marketApiKeyInput, setMarketApiKeyInput] = useState('');
  const [marketApiProviderInput, setMarketApiProviderInput] = useState('TradingView Realtime Engine');
  const [marketApiTesting, setMarketApiTesting] = useState(false);
  const [marketApiTestResult, setMarketApiTestResult] = useState<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch all server data
  const fetchAllData = async () => {
    try {
      const [dashRes, cliRes, payRes, tokRes, setRes, logsRes, apiRes] = await Promise.all([
        fetch('/api/admin/dashboard').then((r) => r.json()),
        fetch('/api/admin/clients').then((r) => r.json()),
        fetch('/api/admin/payments').then((r) => r.json()),
        fetch('/api/admin/tokens').then((r) => r.json()),
        fetch('/api/admin/settings').then((r) => r.json()),
        fetch('/api/admin/audit-logs').then((r) => r.json()),
        fetch('/api/admin/market-api').then((r) => r.json())
      ]);

      setDashboardStats(dashRes);
      setClients(cliRes);
      setPayments(payRes);
      setTokens(tokRes);
      setSettings(setRes);
      setAuditLogs(logsRes);
      setMarketApiInfo(apiRes);

      if (setRes) {
        setTelegramUsername(setRes.telegramUsername || '');
        setTelegramLink(setRes.telegramLink || '');
        setPaymentInstructions(setRes.paymentInstructions || '');
        setPaymentMessage(setRes.paymentMessage || '');
        setSubscriptionPrice(setRes.subscriptionPrice || 29.90);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    }
  };

  useEffect(() => {
    if (adminSession) {
      fetchAllData();
    }
  }, [adminSession]);

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Falha no login.');
      } else {
        setAdminSession(data);
        localStorage.setItem('tradevision_admin_session', JSON.stringify(data));
        showToast(`Bem-vindo, ${data.admin.name}!`);
      }
    } catch {
      setLoginError('Erro de conexão com o servidor.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setAdminSession(null);
    localStorage.removeItem('tradevision_admin_session');
    showToast('Sessão administrativa finalizada.');
  };

  // Client Operations
  const handleClientAction = async (id: string, updates: any, successMsg: string) => {
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        showToast(successMsg);
        fetchAllData();
        if (selectedClientForModal && selectedClientForModal.id === id) {
          setSelectedClientForModal((prev) => (prev ? { ...prev, ...updates } : null));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Cliente ${name} removido com sucesso.`);
        fetchAllData();
        if (selectedClientForModal?.id === id) setSelectedClientForModal(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) return;

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClientName,
          email: newClientEmail,
          status: newClientStatus
        })
      });
      if (res.ok) {
        showToast('Novo cliente cadastrado com sucesso!');
        setNewClientName('');
        setNewClientEmail('');
        setIsAddClientModalOpen(false);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Payment Confirmation
  const handleConfirmPayment = async (payId: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${payId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminName: adminSession?.admin.name || 'Rafael Bank'
        })
      });
      if (res.ok) {
        showToast('Pagamento confirmado e acesso liberado por 30 dias!');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectPayment = async (payId: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${payId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminName: adminSession?.admin.name || 'Rafael Bank',
          reason: 'Comprovante não localizado'
        })
      });
      if (res.ok) {
        showToast('Solicitação de pagamento rejeitada.');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Telegram & Pricing Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramUsername,
          telegramLink,
          paymentInstructions,
          paymentMessage,
          subscriptionPrice
        })
      });
      if (res.ok) {
        showToast('Configurações de Telegram e Preço salvas com sucesso!');
        fetchAllData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsSaving(false);
    }
  };

  // Token Operations
  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenCode: newTokenCode,
          durationDays: newTokenDuration,
          maxUses: newTokenMaxUses,
          notes: newTokenNotes
        })
      });
      if (res.ok) {
        showToast('Novo token de acesso gerado com sucesso!');
        setNewTokenCode('');
        setIsAddTokenModalOpen(false);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeToken = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/tokens/${id}/revoke`, { method: 'POST' });
      if (res.ok) {
        showToast('Token revogado com sucesso.');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Market API Test & Save
  const handleSaveMarketApi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/market-api', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: marketApiKeyInput,
          provider: marketApiProviderInput
        })
      });
      if (res.ok) {
        showToast('Chave de API salva com segurança no servidor.');
        setMarketApiKeyInput('');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestMarketApi = async () => {
    setMarketApiTesting(true);
    setMarketApiTestResult(null);
    try {
      const res = await fetch('/api/admin/market-api/test', { method: 'POST' });
      const data = await res.json();
      setMarketApiTestResult(data);
      if (data.success) {
        showToast('Conexão com a API de mercado verificada com sucesso!');
      }
    } catch (err) {
      console.error(err);
      setMarketApiTestResult({ success: false, error: 'Erro ao se comunicar com o servidor.' });
    } finally {
      setMarketApiTesting(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER: LOGIN FORM (If not logged in)
  // -------------------------------------------------------------
  if (!adminSession) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4 selection:bg-pink-600 selection:text-white">
        <div className="w-full max-w-md bg-zinc-950 border-2 border-pink-500/40 rounded-3xl p-8 shadow-2xl shadow-pink-600/20 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-pink-600/30 text-white">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Painel ADM • Trade Vision IA
            </h1>
            <p className="text-xs text-zinc-400">
              Área de controle exclusiva para os 2 administradores autorizados
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                E-mail do Administrador
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm text-white placeholder-zinc-500 outline-none"
                placeholder="ex: rafaelbank2020@gmail.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                Senha Administrativa
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm text-white placeholder-zinc-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs font-semibold">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-sm tracking-wide shadow-lg shadow-pink-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loginLoading ? 'Verificando credenciais...' : 'Acessar Painel ADM'}
            </button>
          </form>

          {/* Quick Admin Selector for Verification */}
          <div className="pt-3 border-t border-zinc-800/80 space-y-2">
            <span className="text-[11px] text-zinc-500 font-bold uppercase block text-center">
              Administradores Cadastrados no Servidor:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('rafaelbank2020@gmail.com');
                  setLoginPassword('admin123');
                }}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-pink-500/50 text-left cursor-pointer transition-colors"
              >
                <div className="font-bold text-pink-400">Admin 1 (Principal)</div>
                <div className="text-[10px] text-zinc-400 truncate">rafaelbank2020@gmail.com</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginEmail('suporte@tradevision.ai');
                  setLoginPassword('suporte123');
                }}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-pink-500/50 text-left cursor-pointer transition-colors"
              >
                <div className="font-bold text-pink-400">Admin 2 (Co-Admin)</div>
                <div className="text-[10px] text-zinc-400 truncate">suporte@tradevision.ai</div>
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={onExitToClientApp}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              ← Voltar para o Aplicativo Trade Vision IA
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered clients list
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.accessCode.toLowerCase().includes(clientSearch.toLowerCase());
    const matchesStatus = clientStatusFilter === 'Todos' || c.status === clientStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingPaymentsList = payments.filter((p) => p.status === 'Pendente');

  // -------------------------------------------------------------
  // RENDER: AUTHENTICATED ADMIN PANEL
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col lg:flex-row selection:bg-pink-600 selection:text-white">
      {/* Mobile Top Bar */}
      <div className="lg:hidden h-16 bg-zinc-950 border-b border-zinc-800 px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center font-black text-white text-xs">
            TV
          </div>
          <span className="font-extrabold text-sm text-white">Painel ADM</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`w-72 bg-zinc-950 border-r border-zinc-800/90 flex flex-col justify-between p-5 fixed lg:static inset-y-0 left-0 z-50 transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-transform duration-200 ease-in-out`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-600/30 text-white font-black text-sm">
                TV
              </div>
              <div>
                <span className="font-black text-base tracking-tight text-white block">
                  Painel ADM
                </span>
                <span className="text-[11px] text-pink-400 font-bold uppercase tracking-wider">
                  Trade Vision IA
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logged Admin Info */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-pink-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-pink-400 font-extrabold uppercase tracking-wider">
                {adminSession.admin.role === 'superadmin' ? 'Super Administrador' : 'Administrador'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="font-bold text-xs text-white truncate">{adminSession.admin.name}</div>
            <div className="text-[10px] text-zinc-400 truncate">{adminSession.admin.email}</div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs font-bold">
            {[
              { id: 'dashboard', label: 'Dashboard Principal', icon: LayoutDashboard },
              { id: 'clients', label: 'Clientes', icon: Users, badge: clients.length },
              {
                id: 'payments',
                label: 'Pagamentos Pendentes',
                icon: CreditCard,
                badge: pendingPaymentsList.length,
                badgeColor: 'bg-pink-600 text-white'
              },
              { id: 'telegram', label: 'Pagamento e Telegram', icon: Send },
              { id: 'tokens', label: 'Tokens de Acesso', icon: Key },
              { id: 'goals', label: 'Metas de Trading', icon: Target },
              { id: 'reports', label: 'Histórico & Relatórios', icon: FileText },
              { id: 'market-api', label: 'API de Mercado', icon: Radio }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-pink-600 text-white font-extrabold shadow-lg shadow-pink-600/30'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        item.badgeColor || (isActive ? 'bg-white text-pink-600' : 'bg-zinc-800 text-zinc-300')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-800/80 space-y-2">
          <button
            onClick={onExitToClientApp}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-pink-400" />
            <span>Voltar ao App Cliente</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl hover:bg-red-950/40 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Administrative View */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
        {/* TAB 1: DASHBOARD PRINCIPAL */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Dashboard Principal ADM
                </h2>
                <p className="text-xs text-zinc-400">
                  Métricas em tempo real calculadas diretamente a partir do banco de dados do sistema
                </p>
              </div>

              <button
                onClick={fetchAllData}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-pink-400 border border-zinc-800 text-xs font-bold transition-all cursor-pointer shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Atualizar Métricas</span>
              </button>
            </div>

            {/* KPI Cards Grid (12 Indicadores Solicitados) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Card 1: Total de Clientes */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-xl space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Total de Clientes
                </span>
                <div className="text-2xl font-black text-white">
                  {dashboardStats?.totalClients ?? clients.length}
                </div>
                <span className="text-[10px] text-zinc-500 block">Cadastrados no sistema</span>
              </div>

              {/* Card 2: Clientes em Teste Grátis */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-xl space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Em Teste Grátis (24h)
                </span>
                <div className="text-2xl font-black text-amber-300">
                  {dashboardStats?.clientsInTrial ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500 block">Período ativo de avaliação</span>
              </div>

              {/* Card 3: Assinantes Ativos */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-pink-500/40 shadow-xl shadow-pink-600/5 space-y-1">
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">
                  Assinantes Ativos
                </span>
                <div className="text-2xl font-black text-pink-400">
                  {dashboardStats?.activeSubscribers ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500 block">Mensalidade vigente</span>
              </div>

              {/* Card 4: Faturamento Confirmado */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-500/40 shadow-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Pagamentos Confirmados
                </span>
                <div className="text-2xl font-black text-emerald-400">
                  R$ {dashboardStats?.totalConfirmedRevenue?.toFixed(2) ?? '0.00'}
                </div>
                <span className="text-[10px] text-zinc-500 block">Receita total aprovada</span>
              </div>

              {/* Card 5: Acesso Expirado */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-xl space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Acessos Expirados
                </span>
                <div className="text-2xl font-black text-zinc-300">
                  {dashboardStats?.expiredClients ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500 block">Aguardando renovação</span>
              </div>

              {/* Card 6: Clientes Bloqueados */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-xl space-y-1">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                  Clientes Bloqueados
                </span>
                <div className="text-2xl font-black text-red-400">
                  {dashboardStats?.blockedClients ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500 block">Acesso restrito</span>
              </div>

              {/* Card 7: Vencendo em Breve */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-xl space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Próximos do Vencimento
                </span>
                <div className="text-2xl font-black text-amber-300">
                  {dashboardStats?.expiringSoon ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500 block">Vencem em até 3 dias</span>
              </div>

              {/* Card 8: Pagamentos Pendentes */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-pink-500/40 shadow-xl space-y-1">
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">
                  Pedidos no Telegram
                </span>
                <div className="text-2xl font-black text-pink-400">
                  {dashboardStats?.pendingPaymentsCount ?? pendingPaymentsList.length}
                </div>
                <span className="text-[10px] text-zinc-500 block">Aguardando confirmação</span>
              </div>

              {/* Card 9: Total de Operações */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-xl space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Operações Registradas
                </span>
                <div className="text-2xl font-black text-white">
                  {dashboardStats?.totalTrades ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500 block">Trades computados</span>
              </div>

              {/* Card 10: Placar WIN x LOSS */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-xl space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Placar Geral
                </span>
                <div className="text-2xl font-black flex items-baseline gap-1.5">
                  <span className="text-emerald-400">{dashboardStats?.totalWins ?? 0}W</span>
                  <span className="text-zinc-600 text-lg">x</span>
                  <span className="text-red-400">{dashboardStats?.totalLosses ?? 0}L</span>
                </div>
                <span className="text-[10px] text-zinc-500 block">
                  Empates: {dashboardStats?.totalEmpates ?? 0}
                </span>
              </div>

              {/* Card 11: Percentual de Acerto */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Assertividade Média
                </span>
                <div className="text-2xl font-black text-emerald-400">
                  {dashboardStats?.overallWinRate ?? 0}%
                </div>
                <span className="text-[10px] text-zinc-500 block">Base em trades finalizados</span>
              </div>

              {/* Card 12: Metas Diárias Atingidas */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-xl space-y-1">
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">
                  Metas Atingidas
                </span>
                <div className="text-2xl font-black text-pink-300">
                  {dashboardStats?.goalsMetCount ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500 block">Dias no positivo</span>
              </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pending Telegram Payments Alert Box */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-pink-400" />
                    <h3 className="font-extrabold text-sm text-white">
                      Fila de Pagamentos do Telegram ({pendingPaymentsList.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="text-xs text-pink-400 hover:text-pink-300 font-bold"
                  >
                    Ver Todos →
                  </button>
                </div>

                {pendingPaymentsList.length === 0 ? (
                  <div className="text-center py-8 text-xs text-zinc-500">
                    Nenhuma solicitação de liberação pendente no momento.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-850">
                    {pendingPaymentsList.slice(0, 4).map((pay) => (
                      <div key={pay.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-white">{pay.clientName}</div>
                          <div className="text-[11px] text-zinc-400">
                            {pay.clientEmail} • Código: <span className="text-pink-400 font-mono">{pay.clientCode}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-black text-emerald-400">
                            R$ {pay.amount.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleConfirmPayment(pay.id)}
                            className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-black text-[11px] transition-colors cursor-pointer"
                          >
                            Liberar 30D
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Audit Logs */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-pink-400" />
                    Auditoria Recente
                  </h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-850 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-pink-400 uppercase">{log.action}</span>
                        <span className="text-zinc-500">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-tight">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLIENTES */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Gerenciamento de Clientes</h2>
                <p className="text-xs text-zinc-400">
                  Cadastros, controle de 24h grátis, renovação manual de 30 dias e permissões
                </p>
              </div>

              <button
                onClick={() => setIsAddClientModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black shadow-lg shadow-pink-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Cliente</span>
              </button>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, e-mail ou código (ex: TV-8821)..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-pink-500 text-xs text-white placeholder-zinc-500 outline-none"
                />
              </div>

              <select
                value={clientStatusFilter}
                onChange={(e) => setClientStatusFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white outline-none focus:border-pink-500"
              >
                <option value="Todos">Todos os Estados</option>
                <option value="Em teste">Em teste (24h)</option>
                <option value="Assinatura ativa">Assinatura ativa (30D)</option>
                <option value="Aguardando pagamento">Aguardando pagamento</option>
                <option value="Expirado">Expirado</option>
                <option value="Bloqueado">Bloqueado</option>
              </select>
            </div>

            {/* Clients Table */}
            <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/90 text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Período / Validade</th>
                    <th className="py-3 px-4 text-center">Operações</th>
                    <th className="py-3 px-4 text-right">Ações Administrativas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {filteredClients.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{c.name}</div>
                        <div className="text-[11px] text-zinc-500">{c.email}</div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-pink-400">
                        {c.accessCode}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                            c.status === 'Assinatura ativa'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : c.status === 'Em teste'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : c.status === 'Aguardando pagamento'
                              ? 'bg-pink-500/10 text-pink-400 border-pink-500/30'
                              : c.status === 'Bloqueado'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[11px] text-zinc-400">
                        {c.status === 'Assinatura ativa' && c.subscriptionExpiresAt ? (
                          <span className="text-emerald-400 font-semibold">
                            Vence em: {new Date(c.subscriptionExpiresAt).toLocaleDateString('pt-BR')}
                          </span>
                        ) : c.status === 'Em teste' && c.trialExpiresAt ? (
                          <span className="text-amber-300 font-semibold">
                            Teste até: {new Date(c.trialExpiresAt).toLocaleTimeString('pt-BR')} ({new Date(c.trialExpiresAt).toLocaleDateString('pt-BR')})
                          </span>
                        ) : (
                          <span className="text-zinc-600">Sem assinatura ativa</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-zinc-300">
                        {c.trades?.length || 0} trades
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botão Liberar 30 Dias */}
                          <button
                            onClick={() => handleClientAction(c.id, { renewDays: 30, status: 'Assinatura ativa' }, `Acesso de 30 dias liberado para ${c.name}`)}
                            className="px-2.5 py-1 rounded-lg bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white border border-pink-500/40 text-[10px] font-black transition-all cursor-pointer"
                            title="Liberar ou Renovar 30 Dias"
                          >
                            +30D
                          </button>

                          {/* Botão Extensão Teste +24h */}
                          <button
                            onClick={() => handleClientAction(c.id, { extendHours: 24, status: 'Em teste' }, `+24h de teste concedido para ${c.name}`)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/30 text-[10px] font-bold transition-all cursor-pointer"
                            title="Conceder +24h de teste excepcional"
                          >
                            +24h
                          </button>

                          {/* Bloquear / Desbloquear */}
                          {c.status === 'Bloqueado' ? (
                            <button
                              onClick={() => handleClientAction(c.id, { status: 'Expirado' }, `Cliente ${c.name} desbloqueado`)}
                              className="p-1 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900 border border-emerald-800/40 cursor-pointer"
                              title="Desbloquear cliente"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleClientAction(c.id, { status: 'Bloqueado' }, `Cliente ${c.name} bloqueado`)}
                              className="p-1 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900 border border-red-800/40 cursor-pointer"
                              title="Bloquear cliente"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Excluir Conta */}
                          <button
                            onClick={() => handleDeleteClient(c.id, c.name)}
                            className="p-1 rounded-lg bg-zinc-900 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 cursor-pointer"
                            title="Excluir conta (LGPD / Retenção)"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PAGAMENTOS PENDENTES */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Fila de Pagamentos do Telegram</h2>
                <p className="text-xs text-zinc-400">
                  Verifique os comprovantes recebidos e libere os 30 dias de acesso com 1 clique
                </p>
              </div>

              <span className="px-3 py-1 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30 text-xs font-bold">
                {pendingPaymentsList.length} pedidos pendentes
              </span>
            </div>

            <div className="space-y-4">
              {payments.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-500 text-xs">
                  Nenhum registro de pagamento no sistema.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900/90 text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                      <tr>
                        <th className="py-3 px-4">Data / Hora</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Valor</th>
                        <th className="py-3 px-4">Método</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4">Confirmação</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3 px-4 text-zinc-400">
                            {new Date(p.date).toLocaleString('pt-BR')}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{p.clientName}</div>
                            <div className="text-[11px] text-zinc-500">
                              {p.clientEmail} • Código: <span className="text-pink-400 font-mono">{p.clientCode}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-black text-emerald-400 text-sm">
                            R$ {p.amount.toFixed(2)}
                          </td>

                          <td className="py-3 px-4 font-semibold text-zinc-300">
                            {p.method}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                p.status === 'Confirmado'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : p.status === 'Pendente'
                                  ? 'bg-pink-600/20 text-pink-400 border-pink-500/40 animate-pulse'
                                  : 'bg-red-500/10 text-red-400 border-red-500/30'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-[11px] text-zinc-400">
                            {p.confirmedBy ? (
                              <span>
                                {p.confirmedBy} em {p.confirmedAt ? new Date(p.confirmedAt).toLocaleDateString('pt-BR') : ''}
                              </span>
                            ) : (
                              <span className="text-zinc-600">Não confirmado</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {p.status === 'Pendente' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleConfirmPayment(p.id)}
                                  className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-black text-[11px] transition-all cursor-pointer shadow-md shadow-pink-600/20"
                                >
                                  Confirmar e Liberar 30D
                                </button>
                                <button
                                  onClick={() => handleRejectPayment(p.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-300 text-[11px] transition-colors cursor-pointer"
                                >
                                  Rejeitar
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-zinc-500 font-semibold">Concluído</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CONFIGURAÇÃO DO TELEGRAM & PAGAMENTO */}
        {activeTab === 'telegram' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-zinc-800">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Configuração de Pagamento e Telegram
              </h2>
              <p className="text-xs text-zinc-400">
                Altere seu @usuário, link de suporte e preço da assinatura sem precisar alterar o código do aplicativo
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-5 max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Usuário do Telegram (@)
                  </label>
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    required
                    placeholder="@seuusuario"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-pink-500 text-xs text-white outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">Ex: @tradevision_oficial</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Link Completo do Perfil
                  </label>
                  <input
                    type="url"
                    value={telegramLink}
                    onChange={(e) => setTelegramLink(e.target.value)}
                    required
                    placeholder="https://t.me/seuusuario"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-pink-500 text-xs text-white outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">Link que o cliente clica para abrir a conversa</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-850">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Preço da Assinatura Mensal (R$)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.10"
                      value={subscriptionPrice}
                      onChange={(e) => setSubscriptionPrice(Number(e.target.value))}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-pink-500 text-sm font-black text-pink-400 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500">Padrão: R$ 29,90 por 30 dias</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Duração da Licença (Dias)
                  </label>
                  <input
                    type="number"
                    value={30}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">30 dias corridos por ativação</span>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-850">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Instruções de Pagamento (PIX / Chaves)
                </label>
                <textarea
                  rows={3}
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  placeholder="Informe a chave PIX e detalhes para o cliente realizar a transferência..."
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-pink-500 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Mensagem Automática Pré-configurada para o Cliente Enviar
                </label>
                <textarea
                  rows={2}
                  value={paymentMessage}
                  onChange={(e) => setPaymentMessage(e.target.value)}
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-pink-500 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs shadow-lg shadow-pink-600/30 transition-all cursor-pointer"
                >
                  {settingsSaving ? 'Salvando no banco...' : 'Salvar Configurações'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: TOKENS DE ACESSO */}
        {activeTab === 'tokens' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Tokens e Códigos de Acesso</h2>
                <p className="text-xs text-zinc-400">
                  Gere chaves exclusivas para clientes, promoções ou suporte com validade no servidor
                </p>
              </div>

              <button
                onClick={() => setIsAddTokenModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black shadow-lg shadow-pink-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Gerar Novo Token</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/90 text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Código do Token</th>
                    <th className="py-3 px-4">Duração</th>
                    <th className="py-3 px-4">Utilizações</th>
                    <th className="py-3 px-4">Expiração</th>
                    <th className="py-3 px-4">Observações</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {tokens.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-pink-400 text-sm">
                        {t.tokenCode}
                      </td>

                      <td className="py-3 px-4 font-bold text-white">
                        {t.durationDays} dias
                      </td>

                      <td className="py-3 px-4 text-zinc-300">
                        {t.currentUses} / {t.maxUses} usadas
                      </td>

                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {new Date(t.expiresAt).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {t.notes || '—'}
                      </td>

                      <td className="py-3 px-4">
                        {t.isRevoked ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800/40">
                            Revogado
                          </span>
                        ) : t.currentUses >= t.maxUses ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400">
                            Esgotado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                            Ativo
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!t.isRevoked && (
                          <button
                            onClick={() => handleRevokeToken(t.id)}
                            className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors cursor-pointer"
                          >
                            Revogar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: METAS DE TRADING (CONFIGURAÇÃO) */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-zinc-800">
              <h2 className="text-2xl font-black text-white tracking-tight">Metas de Trading & Gestão de Risco</h2>
              <p className="text-xs text-zinc-400">
                Parâmetros padrão das planilhas dos clientes e limites de disciplina diária
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <h3 className="font-bold text-sm text-pink-400 uppercase tracking-wider">
                  Parâmetros Padrão do Sistema
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-zinc-850">
                    <span className="text-zinc-400">Meta Diária Padrão (Stop Win):</span>
                    <span className="font-extrabold text-emerald-400">
                      +{settings?.defaultProfitGoalPercent || 10}% ao dia
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-zinc-850">
                    <span className="text-zinc-400">Limite Diário de Perda (Stop Loss):</span>
                    <span className="font-extrabold text-red-400">
                      -{settings?.defaultLossLimitPercent || 6}% ao dia
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-zinc-850">
                    <span className="text-zinc-400">Entrada Padrão por Operação:</span>
                    <span className="font-extrabold text-white">
                      {settings?.defaultStakePercent || 2.5}% da banca
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-zinc-850">
                    <span className="text-zinc-400">Máximo de Operações / Dia:</span>
                    <span className="font-extrabold text-pink-400">
                      {settings?.defaultMaxTradesPerDay || 5} Operações
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                  💡 Os clientes podem usar esses parâmetros ou personalizar sua banca e valor das entradas individualmente na planilha própria.
                </div>
              </div>

              {/* Status Geral de Assertividade */}
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                  Assertividade Coletiva dos Clientes
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-zinc-300 mb-1">
                      <span>Taxa de Acerto (WIN Rate)</span>
                      <span className="font-black text-emerald-400">{dashboardStats?.overallWinRate ?? 0}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${dashboardStats?.overallWinRate ?? 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-center">
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-850">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Total WINs</span>
                      <span className="text-xl font-black text-emerald-400">{dashboardStats?.totalWins ?? 0}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-850">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Total LOSSes</span>
                      <span className="text-xl font-black text-red-400">{dashboardStats?.totalLosses ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: HISTÓRICO & RELATÓRIOS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-zinc-800">
              <h2 className="text-2xl font-black text-white tracking-tight">Histórico de Auditoria e Relatórios</h2>
              <p className="text-xs text-zinc-400">
                Log completo de alterações administrativas, confirmações de pagamentos e eventos de licença
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/90 text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Data e Hora</th>
                    <th className="py-3 px-4">Responsável</th>
                    <th className="py-3 px-4">Ação</th>
                    <th className="py-3 px-4">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {log.adminName}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-pink-400">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: API DE MERCADO */}
        {activeTab === 'market-api' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-zinc-800">
              <h2 className="text-2xl font-black text-white tracking-tight">Configuração da API de Mercado</h2>
              <p className="text-xs text-zinc-400">
                Gerencie com segurança a chave de fornecimento de dados em tempo real sem expô-la no código público
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form to update key */}
              <form onSubmit={handleSaveMarketApi} className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <h3 className="font-bold text-sm text-pink-400 uppercase tracking-wider">
                  Atualizar Chave Secreta
                </h3>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 block">Provedor de Cotações</label>
                  <input
                    type="text"
                    value={marketApiProviderInput}
                    onChange={(e) => setMarketApiProviderInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 block">Chave da API (Secreta no Servidor)</label>
                  <input
                    type="password"
                    placeholder="Insira a nova chave da API (ex: tv_live_...)"
                    value={marketApiKeyInput}
                    onChange={(e) => setMarketApiKeyInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none focus:border-pink-500 font-mono"
                  />
                  <span className="text-[10px] text-zinc-500">
                    A chave atual está mascarada no servidor:{' '}
                    <strong className="text-zinc-300 font-mono">{marketApiInfo?.maskedKey || '••••••••'}</strong>
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-lg shadow-pink-600/20 transition-all cursor-pointer"
                  >
                    Salvar Chave no Servidor
                  </button>
                </div>
              </form>

              {/* Status and Connection Real Test */}
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                    Estado da Conexão
                  </h3>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    ATIVO NO SERVIDOR
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  O Trade Vision IA conecta os gráficos TradingView e os sinais algorítmicos através de feeds de baixa latência.
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleTestMarketApi}
                    disabled={marketApiTesting}
                    className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-pink-400 border border-pink-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>{marketApiTesting ? 'Testando conexão real...' : 'Executar Teste Real de Conexão'}</span>
                  </button>
                </div>

                {marketApiTestResult && (
                  <div className={`p-4 rounded-xl text-xs space-y-2 border ${
                    marketApiTestResult.success
                      ? 'bg-emerald-950/30 text-emerald-200 border-emerald-500/30'
                      : 'bg-red-950/30 text-red-200 border-red-500/30'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{marketApiTestResult.message}</span>
                    </div>
                    {marketApiTestResult.sampleQuote && (
                      <div className="text-[11px] font-mono text-zinc-300 pt-1 border-t border-emerald-500/20">
                        Ativo: {marketApiTestResult.testedAsset} | Cotação: {marketApiTestResult.sampleQuote.bid} / {marketApiTestResult.sampleQuote.ask} | Latência: {marketApiTestResult.latencyMs}ms
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Novo Cliente */}
      {isAddClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 border-2 border-pink-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-extrabold text-base text-white">Cadastrar Novo Cliente</h3>
              <button
                onClick={() => setIsAddClientModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="carlos@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">Status Inicial</label>
                <select
                  value={newClientStatus}
                  onChange={(e) => setNewClientStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-pink-500"
                >
                  <option value="Em teste">Em teste (24 horas grátis)</option>
                  <option value="Assinatura ativa">Assinatura ativa (30 dias liberados)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold shadow-md shadow-pink-600/20"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gerar Token de Acesso */}
      {isAddTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 border-2 border-pink-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-extrabold text-base text-white">Gerar Novo Token de Acesso</h3>
              <button
                onClick={() => setIsAddTokenModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateToken} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  Código do Token (ou deixe em branco para gerar aleatório)
                </label>
                <input
                  type="text"
                  value={newTokenCode}
                  onChange={(e) => setNewTokenCode(e.target.value.toUpperCase())}
                  placeholder="Ex: TV-PROMO-30D"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono uppercase outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Duração (Dias)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={newTokenDuration}
                    onChange={(e) => setNewTokenDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-pink-500 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Limite de Usos</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={newTokenMaxUses}
                    onChange={(e) => setNewTokenMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-pink-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">Finalidade / Observações</label>
                <input
                  type="text"
                  value={newTokenNotes}
                  onChange={(e) => setNewTokenNotes(e.target.value)}
                  placeholder="Ex: Campanha de lançamento Telegram"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-pink-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTokenModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold shadow-md shadow-pink-600/20"
                >
                  Criar Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900/95 border border-pink-500/80 text-white shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-pink-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-zinc-400 hover:text-white ml-2 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
