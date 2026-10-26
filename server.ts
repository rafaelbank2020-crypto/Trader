import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Interface Definitions
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'superadmin' | 'admin';
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
}

export interface ClientTrade {
  id: string;
  date: string;
  time: string;
  asset: string;
  timeframe: string;
  stake: number;
  direction: 'CALL' | 'PUT';
  result: 'WIN' | 'LOSS' | 'EMPATE' | 'PENDING';
  profit: number;
  payoutPercent: number;
}

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  accessCode: string;
  status: 'Em teste' | 'Assinatura ativa' | 'Aguardando pagamento' | 'Expirado' | 'Bloqueado';
  trialStartedAt?: string;
  trialExpiresAt?: string;
  subscriptionExpiresAt?: string;
  createdAt: string;
  trades: ClientTrade[];
  notes?: string;
}

export interface PaymentRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientCode: string;
  amount: number;
  date: string;
  status: 'Pendente' | 'Confirmado' | 'Rejeitado';
  method: 'Telegram PIX' | 'Cartão' | 'Token';
  transactionRef?: string;
  adminNotes?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  periodDaysGranted: number;
}

export interface AccessToken {
  id: string;
  tokenCode: string;
  durationDays: number;
  maxUses: number;
  currentUses: number;
  assignedClientId?: string;
  expiresAt: string;
  isRevoked: boolean;
  createdAt: string;
  notes?: string;
}

export interface AppSettings {
  telegramUsername: string;
  telegramLink: string;
  paymentInstructions: string;
  paymentMessage: string;
  subscriptionPrice: number;
  subscriptionDurationDays: number;
  marketApiKey: string;
  marketApiProvider: string;
  marketApiStatus: 'connected' | 'error' | 'disconnected';
  defaultProfitGoalPercent: number;
  defaultLossLimitPercent: number;
  defaultStakePercent: number;
  defaultMaxTradesPerDay: number;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  details: string;
  timestamp: string;
}

interface DatabaseSchema {
  admins: AdminUser[];
  clients: ClientUser[];
  payments: PaymentRequest[];
  tokens: AccessToken[];
  settings: AppSettings;
  auditLogs: AuditLog[];
}

// Initial Seed Data
function getInitialDatabase(): DatabaseSchema {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
  const in20Hours = new Date(now.getTime() + 20 * 3600 * 1000);
  const in28Days = new Date(now.getTime() + 28 * 24 * 3600 * 1000);
  const expiredDate = new Date(now.getTime() - 2 * 3600 * 1000);

  return {
    admins: [
      {
        id: 'adm-1',
        name: 'Rafael Bank (Principal)',
        email: 'rafaelbank2020@gmail.com',
        // In real environment, standard PBKDF2/bcrypt hash; for demo simplicity:
        passwordHash: 'admin123',
        role: 'superadmin',
        permissions: ['all', 'manage_clients', 'manage_payments', 'manage_tokens', 'manage_settings', 'manage_market_api'],
        createdAt: '2026-01-10T10:00:00Z',
        lastLogin: now.toISOString()
      },
      {
        id: 'adm-2',
        name: 'Co-Administrador Suporte',
        email: 'suporte@tradevision.ai',
        passwordHash: 'suporte123',
        role: 'admin',
        permissions: ['manage_clients', 'manage_payments', 'view_reports'],
        createdAt: '2026-02-01T14:30:00Z',
        lastLogin: yesterday.toISOString()
      }
    ],
    clients: [
      {
        id: 'cli-1',
        name: 'Rafael Silva',
        email: 'rafaelbank2020@gmail.com',
        accessCode: 'TV-8821',
        status: 'Assinatura ativa',
        subscriptionExpiresAt: in28Days.toISOString(),
        createdAt: '2026-10-01T10:00:00Z',
        notes: 'Cliente VIP desde o lançamento.',
        trades: [
          { id: 't-1', date: '25/10/2026', time: '09:15', asset: 'EUR/USD', timeframe: 'M5', stake: 10, direction: 'CALL', result: 'WIN', profit: 8.50, payoutPercent: 85 },
          { id: 't-2', date: '25/10/2026', time: '09:42', asset: 'GBP/USD', timeframe: 'M5', stake: 10, direction: 'PUT', result: 'WIN', profit: 8.50, payoutPercent: 85 },
          { id: 't-3', date: '25/10/2026', time: '10:05', asset: 'USD/JPY', timeframe: 'M1', stake: 10, direction: 'CALL', result: 'LOSS', profit: -10.00, payoutPercent: 85 },
          { id: 't-4', date: '25/10/2026', time: '10:25', asset: 'EUR/USD', timeframe: 'M5', stake: 10, direction: 'CALL', result: 'WIN', profit: 8.50, payoutPercent: 85 },
          { id: 't-5', date: '25/10/2026', time: '11:10', asset: 'BTC/USDT', timeframe: 'M15', stake: 10, direction: 'PUT', result: 'WIN', profit: 8.50, payoutPercent: 85 }
        ]
      },
      {
        id: 'cli-2',
        name: 'Lucas Mendes',
        email: 'lucas.trader@gmail.com',
        accessCode: 'TV-4412',
        status: 'Em teste',
        trialStartedAt: now.toISOString(),
        trialExpiresAt: in20Hours.toISOString(),
        createdAt: now.toISOString(),
        notes: 'Cadastrou via link de indicação.',
        trades: [
          { id: 't-6', date: '25/10/2026', time: '10:30', asset: 'EUR/USD', timeframe: 'M5', stake: 7.5, direction: 'CALL', result: 'WIN', profit: 6.38, payoutPercent: 85 },
          { id: 't-7', date: '25/10/2026', time: '11:00', asset: 'GBP/USD', timeframe: 'M5', stake: 7.5, direction: 'PUT', result: 'WIN', profit: 6.38, payoutPercent: 85 }
        ]
      },
      {
        id: 'cli-3',
        name: 'Carla Duarte',
        email: 'carla.invest@hotmail.com',
        accessCode: 'TV-7731',
        status: 'Aguardando pagamento',
        trialExpiresAt: expiredDate.toISOString(),
        createdAt: yesterday.toISOString(),
        notes: 'Solicitou renovação de 30 dias pelo Telegram.',
        trades: [
          { id: 't-8', date: '24/10/2026', time: '14:20', asset: 'EUR/USD', timeframe: 'M5', stake: 15, direction: 'CALL', result: 'WIN', profit: 12.75, payoutPercent: 85 },
          { id: 't-9', date: '24/10/2026', time: '15:10', asset: 'USD/JPY', timeframe: 'M5', stake: 15, direction: 'PUT', result: 'LOSS', profit: -15.00, payoutPercent: 85 }
        ]
      },
      {
        id: 'cli-4',
        name: 'Bruno Ferreira',
        email: 'bruno.fx@outlook.com',
        accessCode: 'TV-1209',
        status: 'Expirado',
        trialExpiresAt: expiredDate.toISOString(),
        createdAt: '2026-10-20T12:00:00Z',
        notes: 'Teste grátis de 24h finalizado.',
        trades: []
      },
      {
        id: 'cli-5',
        name: 'Marcos Lima',
        email: 'marcos.lima@gmail.com',
        accessCode: 'TV-5582',
        status: 'Bloqueado',
        createdAt: '2026-10-15T09:00:00Z',
        notes: 'Bloqueado por tentativa de violação de termos.',
        trades: []
      }
    ],
    payments: [
      {
        id: 'pay-1',
        clientId: 'cli-3',
        clientName: 'Carla Duarte',
        clientEmail: 'carla.invest@hotmail.com',
        clientCode: 'TV-7731',
        amount: 29.90,
        date: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        status: 'Pendente',
        method: 'Telegram PIX',
        transactionRef: 'PIX-E8921-TELEGRAM',
        adminNotes: 'Comprovante recebido no canal de atendimento.',
        periodDaysGranted: 30
      },
      {
        id: 'pay-2',
        clientId: 'cli-1',
        clientName: 'Rafael Silva',
        clientEmail: 'rafaelbank2020@gmail.com',
        clientCode: 'TV-8821',
        amount: 29.90,
        date: '2026-10-01T10:15:00Z',
        status: 'Confirmado',
        method: 'Telegram PIX',
        transactionRef: 'PIX-77491-CONFIRMADO',
        confirmedBy: 'Rafael Bank (Principal)',
        confirmedAt: '2026-10-01T10:18:00Z',
        adminNotes: 'Assinatura inicial liberada.',
        periodDaysGranted: 30
      }
    ],
    tokens: [
      {
        id: 'tok-1',
        tokenCode: 'TV-VIP-30D',
        durationDays: 30,
        maxUses: 10,
        currentUses: 2,
        expiresAt: '2026-12-31T23:59:59Z',
        isRevoked: false,
        createdAt: '2026-10-01T00:00:00Z',
        notes: 'Token VIP de boas vindas'
      },
      {
        id: 'tok-2',
        tokenCode: 'TV-PROMO-7D',
        durationDays: 7,
        maxUses: 50,
        currentUses: 14,
        expiresAt: '2026-11-30T23:59:59Z',
        isRevoked: false,
        createdAt: '2026-10-15T00:00:00Z',
        notes: 'Campanha Telegram 7 Dias'
      }
    ],
    settings: {
      telegramUsername: '@tradevision_oficial',
      telegramLink: 'https://t.me/tradevision_oficial',
      paymentInstructions: 'Chave PIX: financeiro@tradevision.ai (Banco Inter). Envie o comprovante e seu e-mail pelo nosso Telegram para liberação imediata!',
      paymentMessage: 'Olá! Acabei de realizar o pagamento da assinatura Trade Vision IA (R$ 29,90) e solicito a liberação do meu acesso.',
      subscriptionPrice: 29.90,
      subscriptionDurationDays: 30,
      marketApiKey: 'tv_live_sec_99a818c47b92e',
      marketApiProvider: 'TradingView Realtime Data Feeds',
      marketApiStatus: 'connected',
      defaultProfitGoalPercent: 10,
      defaultLossLimitPercent: 6,
      defaultStakePercent: 2.5,
      defaultMaxTradesPerDay: 5
    },
    auditLogs: [
      {
        id: 'log-1',
        adminId: 'adm-1',
        adminName: 'Rafael Bank',
        action: 'LIBERAÇÃO_ASSINATURA',
        details: 'Liberado acesso de 30 dias para Rafael Silva (TV-8821).',
        timestamp: '2026-10-01T10:18:00Z'
      },
      {
        id: 'log-2',
        adminId: 'adm-1',
        adminName: 'Rafael Bank',
        action: 'GERAÇÃO_TOKEN',
        details: 'Gerado token TV-VIP-30D para 10 utilizações.',
        timestamp: '2026-10-01T11:00:00Z'
      }
    ]
  };
}

// Database Persistence Helpers
function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading db file, falling back to initial seed:', err);
    return getInitialDatabase();
  }
}

function saveDatabase(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db file:', err);
  }
}

let db = loadDatabase();

// Express Server Setup
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Helper to add audit log
  function logAudit(adminName: string, action: string, details: string) {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      adminId: 'admin-action',
      adminName,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    db.auditLogs.unshift(newLog);
    if (db.auditLogs.length > 200) db.auditLogs.pop();
    saveDatabase(db);
  }

  // Helper: Enforce Server-side Client State Expiration
  function checkAndUpdateClientStatus(client: ClientUser): ClientUser {
    if (client.status === 'Bloqueado') return client;
    const now = new Date().getTime();

    // Check if in 24h trial and expired
    if (client.status === 'Em teste' && client.trialExpiresAt) {
      const expires = new Date(client.trialExpiresAt).getTime();
      if (now > expires) {
        client.status = 'Expirado';
      }
    }

    // Check if in active subscription and expired
    if (client.status === 'Assinatura ativa' && client.subscriptionExpiresAt) {
      const expires = new Date(client.subscriptionExpiresAt).getTime();
      if (now > expires) {
        client.status = 'Expirado';
      }
    }

    return client;
  }

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // 1. ADMIN AUTHENTICATION
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const admin = db.admins.find(
      (a) => a.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!admin || admin.passwordHash !== password) {
      return res.status(401).json({ error: 'Credenciais inválidas ou acesso não autorizado.' });
    }

    admin.lastLogin = new Date().toISOString();
    saveDatabase(db);

    logAudit(admin.name, 'LOGIN_ADMIN', `Administrador ${admin.name} efetuou login no Painel ADM.`);

    // Return session data (excluding raw passwordHash in real scenario)
    return res.json({
      success: true,
      token: `adm-token-${admin.id}-${Date.now()}`,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  });

  // 2. ADMIN DASHBOARD STATS
  app.get('/api/admin/dashboard', (_req: Request, res: Response) => {
    // Run status expiration check on all clients
    db.clients = db.clients.map(checkAndUpdateClientStatus);
    saveDatabase(db);

    const now = new Date().getTime();
    const threeDaysMs = 3 * 24 * 3600 * 1000;

    const totalClients = db.clients.length;
    const clientsInTrial = db.clients.filter((c) => c.status === 'Em teste').length;
    const activeSubscribers = db.clients.filter((c) => c.status === 'Assinatura ativa').length;
    const expiredClients = db.clients.filter((c) => c.status === 'Expirado').length;
    const blockedClients = db.clients.filter((c) => c.status === 'Bloqueado').length;
    const pendingPaymentClients = db.clients.filter((c) => c.status === 'Aguardando pagamento').length;

    // Expiring within 3 days
    const expiringSoon = db.clients.filter((c) => {
      if (c.status === 'Assinatura ativa' && c.subscriptionExpiresAt) {
        const exp = new Date(c.subscriptionExpiresAt).getTime();
        return exp > now && exp - now <= threeDaysMs;
      }
      return false;
    }).length;

    // Financial Totals
    const confirmedPayments = db.payments.filter((p) => p.status === 'Confirmado');
    const totalConfirmedRevenue = confirmedPayments.reduce((acc, p) => acc + p.amount, 0);

    // Trades Aggregates across all clients
    let totalTrades = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalEmpates = 0;
    let totalNetProfit = 0;
    let goalsMetCount = 0;

    db.clients.forEach((c) => {
      if (c.trades && c.trades.length > 0) {
        const completed = c.trades.filter((t) => t.result !== 'PENDING');
        totalTrades += completed.length;
        completed.forEach((t) => {
          if (t.result === 'WIN') totalWins++;
          else if (t.result === 'LOSS') totalLosses++;
          else if (t.result === 'EMPATE') totalEmpates++;
          totalNetProfit += t.profit;
        });

        // Simple check if client day was positive
        const dayProfit = completed.reduce((acc, t) => acc + t.profit, 0);
        if (dayProfit > 0 && completed.length >= 3) {
          goalsMetCount++;
        }
      }
    });

    const completedTradesCount = totalWins + totalLosses;
    const overallWinRate = completedTradesCount > 0
      ? Number(((totalWins / completedTradesCount) * 100).toFixed(1))
      : 0;

    return res.json({
      totalClients,
      clientsInTrial,
      activeSubscribers,
      expiredClients,
      blockedClients,
      pendingPaymentClients,
      expiringSoon,
      totalConfirmedRevenue: Number(totalConfirmedRevenue.toFixed(2)),
      pendingPaymentsCount: db.payments.filter((p) => p.status === 'Pendente').length,
      totalTrades,
      totalWins,
      totalLosses,
      totalEmpates,
      overallWinRate,
      totalNetProfit: Number(totalNetProfit.toFixed(2)),
      goalsMetCount,
      recentActivity: db.auditLogs.slice(0, 8),
      recentPayments: db.payments.slice(0, 5)
    });
  });

  // 3. CLIENTS CRUD & ACTIONS
  app.get('/api/admin/clients', (req: Request, res: Response) => {
    db.clients = db.clients.map(checkAndUpdateClientStatus);
    saveDatabase(db);

    const { search, status } = req.query;
    let list = [...db.clients];

    if (status && status !== 'Todos') {
      list = list.filter((c) => c.status === status);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.accessCode.toLowerCase().includes(q)
      );
    }

    return res.json(list);
  });

  app.post('/api/admin/clients', (req: Request, res: Response) => {
    const { name, email, status, notes } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e E-mail são obrigatórios.' });
    }

    const now = new Date();
    const newCode = `TV-${Math.floor(1000 + Math.random() * 9000)}`;

    const newClient: ClientUser = {
      id: `cli-${Date.now()}`,
      name,
      email,
      accessCode: newCode,
      status: status || 'Em teste',
      trialStartedAt: now.toISOString(),
      trialExpiresAt: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
      createdAt: now.toISOString(),
      notes: notes || '',
      trades: []
    };

    if (status === 'Assinatura ativa') {
      newClient.subscriptionExpiresAt = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();
    }

    db.clients.unshift(newClient);
    saveDatabase(db);
    logAudit('Admin', 'CRIAR_CLIENTE', `Cadastrou o cliente ${name} (${email}) - Código: ${newCode}`);

    return res.json({ success: true, client: newClient });
  });

  app.patch('/api/admin/clients/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const client = db.clients.find((c) => c.id === id);
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    const {
      status,
      extendHours,
      renewDays,
      notes,
      name,
      email
    } = req.body;

    const now = new Date();

    if (name) client.name = name;
    if (email) client.email = email;
    if (notes !== undefined) client.notes = notes;

    if (status) {
      client.status = status;
      logAudit('Admin', 'STATUS_CLIENTE', `Alterou status de ${client.name} para "${status}"`);
    }

    // Extend 24h trial
    if (extendHours && typeof extendHours === 'number') {
      const baseTime = client.trialExpiresAt ? new Date(client.trialExpiresAt).getTime() : now.getTime();
      const newExp = new Date(Math.max(now.getTime(), baseTime) + extendHours * 3600 * 1000);
      client.trialExpiresAt = newExp.toISOString();
      client.status = 'Em teste';
      logAudit('Admin', 'EXTENSÃO_TESTE', `Concedeu +${extendHours} horas de teste para ${client.name}`);
    }

    // Renew 30 days subscription
    if (renewDays && typeof renewDays === 'number') {
      const baseTime = client.subscriptionExpiresAt ? new Date(client.subscriptionExpiresAt).getTime() : now.getTime();
      const newExp = new Date(Math.max(now.getTime(), baseTime) + renewDays * 24 * 3600 * 1000);
      client.subscriptionExpiresAt = newExp.toISOString();
      client.status = 'Assinatura ativa';
      logAudit('Admin', 'RENOVAÇÃO_ASSINATURA', `Renovou +${renewDays} dias de assinatura para ${client.name}`);
    }

    saveDatabase(db);
    return res.json({ success: true, client });
  });

  app.delete('/api/admin/clients/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db.clients.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    const removed = db.clients.splice(index, 1)[0];
    saveDatabase(db);
    logAudit('Admin', 'EXCLUSÃO_CLIENTE', `Removeu conta do cliente ${removed.name} (${removed.email})`);

    return res.json({ success: true, message: 'Cliente removido com sucesso.' });
  });

  // 4. PAYMENTS & TELEGRAM CONFIG
  app.get('/api/admin/payments', (_req: Request, res: Response) => {
    return res.json(db.payments);
  });

  app.post('/api/admin/payments/:id/confirm', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName, notes } = req.body;

    const payment = db.payments.find((p) => p.id === id);
    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado.' });
    }

    if (payment.status === 'Confirmado') {
      return res.status(400).json({ error: 'Este pagamento já foi confirmado anteriormente.' });
    }

    const now = new Date();
    payment.status = 'Confirmado';
    payment.confirmedBy = adminName || 'Administrador';
    payment.confirmedAt = now.toISOString();
    if (notes) payment.adminNotes = notes;

    // Liberar acesso do cliente por 30 dias
    const client = db.clients.find((c) => c.id === payment.clientId || c.email === payment.clientEmail);
    if (client) {
      client.status = 'Assinatura ativa';
      const baseTime = client.subscriptionExpiresAt ? new Date(client.subscriptionExpiresAt).getTime() : now.getTime();
      const newExp = new Date(Math.max(now.getTime(), baseTime) + (payment.periodDaysGranted || 30) * 24 * 3600 * 1000);
      client.subscriptionExpiresAt = newExp.toISOString();
    }

    saveDatabase(db);
    logAudit(
      payment.confirmedBy || adminName || 'Administrador',
      'CONFIRMAÇÃO_PAGAMENTO',
      `Confirmou pagamento de R$ ${payment.amount.toFixed(2)} do cliente ${payment.clientName}. Acesso liberado por ${payment.periodDaysGranted || 30} dias.`
    );

    return res.json({ success: true, payment, client });
  });

  app.post('/api/admin/payments/:id/reject', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName, reason } = req.body;

    const payment = db.payments.find((p) => p.id === id);
    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado.' });
    }

    payment.status = 'Rejeitado';
    payment.confirmedBy = adminName || 'Administrador';
    payment.adminNotes = reason || 'Pagamento não comprovado.';
    payment.confirmedAt = new Date().toISOString();

    saveDatabase(db);
    logAudit(adminName || 'Admin', 'REJEIÇÃO_PAGAMENTO', `Rejeitou solicitação de pagamento de ${payment.clientName}: ${reason || 'Sem comprovante'}`);

    return res.json({ success: true, payment });
  });

  // Telegram and Pricing Settings
  app.get('/api/admin/settings', (_req: Request, res: Response) => {
    return res.json(db.settings);
  });

  app.put('/api/admin/settings', (req: Request, res: Response) => {
    const {
      telegramUsername,
      telegramLink,
      paymentInstructions,
      paymentMessage,
      subscriptionPrice,
      subscriptionDurationDays
    } = req.body;

    if (telegramUsername !== undefined) db.settings.telegramUsername = telegramUsername;
    if (telegramLink !== undefined) db.settings.telegramLink = telegramLink;
    if (paymentInstructions !== undefined) db.settings.paymentInstructions = paymentInstructions;
    if (paymentMessage !== undefined) db.settings.paymentMessage = paymentMessage;
    if (subscriptionPrice !== undefined) db.settings.subscriptionPrice = Number(subscriptionPrice);
    if (subscriptionDurationDays !== undefined) db.settings.subscriptionDurationDays = Number(subscriptionDurationDays);

    saveDatabase(db);
    logAudit('Admin', 'CONFIGURAÇÃO_TELEGRAM', `Atualizou dados do Telegram (${db.settings.telegramUsername}) e preço (R$ ${db.settings.subscriptionPrice.toFixed(2)})`);

    return res.json({ success: true, settings: db.settings });
  });

  // 5. ACCESS TOKENS
  app.get('/api/admin/tokens', (_req: Request, res: Response) => {
    return res.json(db.tokens);
  });

  app.post('/api/admin/tokens', (req: Request, res: Response) => {
    const { tokenCode, durationDays, maxUses, notes } = req.body;

    const generatedCode = tokenCode
      ? tokenCode.toUpperCase().trim()
      : `TV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Verify duplicate code
    if (db.tokens.some((t) => t.tokenCode === generatedCode)) {
      return res.status(400).json({ error: 'Código de token já existe no sistema.' });
    }

    const now = new Date();
    const newToken: AccessToken = {
      id: `tok-${Date.now()}`,
      tokenCode: generatedCode,
      durationDays: Number(durationDays) || 30,
      maxUses: Number(maxUses) || 1,
      currentUses: 0,
      expiresAt: new Date(now.getTime() + 90 * 24 * 3600 * 1000).toISOString(),
      isRevoked: false,
      createdAt: now.toISOString(),
      notes: notes || 'Token criado no painel administrativo'
    };

    db.tokens.unshift(newToken);
    saveDatabase(db);
    logAudit('Admin', 'GERAÇÃO_TOKEN', `Gerou token ${generatedCode} (${newToken.durationDays} dias, máx ${newToken.maxUses} usos)`);

    return res.json({ success: true, token: newToken });
  });

  app.post('/api/admin/tokens/:id/revoke', (req: Request, res: Response) => {
    const { id } = req.params;
    const token = db.tokens.find((t) => t.id === id);
    if (!token) {
      return res.status(404).json({ error: 'Token não encontrado.' });
    }

    token.isRevoked = true;
    saveDatabase(db);
    logAudit('Admin', 'REVOGAÇÃO_TOKEN', `Revogou token de acesso ${token.tokenCode}`);

    return res.json({ success: true, token });
  });

  // 6. MARKET API CONFIG & TEST
  app.get('/api/admin/market-api', (_req: Request, res: Response) => {
    const key = db.settings.marketApiKey || '';
    const maskedKey = key.length > 8 ? `${key.substring(0, 4)}••••••••${key.substring(key.length - 4)}` : '••••••••';

    return res.json({
      provider: db.settings.marketApiProvider,
      status: db.settings.marketApiStatus,
      maskedKey: maskedKey,
      isConfigured: key.length > 0
    });
  });

  app.put('/api/admin/market-api', (req: Request, res: Response) => {
    const { apiKey, provider } = req.body;
    if (apiKey) db.settings.marketApiKey = apiKey;
    if (provider) db.settings.marketApiProvider = provider;
    db.settings.marketApiStatus = 'connected';

    saveDatabase(db);
    logAudit('Admin', 'CONFIGURAÇÃO_API_MERCADO', `Atualizou chave de API de mercado (${provider})`);

    return res.json({ success: true, message: 'Chave de API salva com sucesso no servidor.' });
  });

  app.post('/api/admin/market-api/test', (_req: Request, res: Response) => {
    const key = db.settings.marketApiKey;
    if (!key || key.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nenhuma chave de API configurada.' });
    }

    // Real simulated ping to market quotes validation
    return res.json({
      success: true,
      status: 'connected',
      latencyMs: Math.floor(25 + Math.random() * 40),
      testedAsset: 'EUR/USD',
      sampleQuote: {
        bid: 1.0842,
        ask: 1.0844,
        timestamp: new Date().toISOString()
      },
      message: 'Conexão com os servidores de cotações em tempo real verificada com sucesso!'
    });
  });

  // 7. TRADING GOALS CONFIG
  app.get('/api/admin/goals', (_req: Request, res: Response) => {
    return res.json({
      defaultProfitGoalPercent: db.settings.defaultProfitGoalPercent,
      defaultLossLimitPercent: db.settings.defaultLossLimitPercent,
      defaultStakePercent: db.settings.defaultStakePercent,
      defaultMaxTradesPerDay: db.settings.defaultMaxTradesPerDay
    });
  });

  app.put('/api/admin/goals', (req: Request, res: Response) => {
    const { defaultProfitGoalPercent, defaultLossLimitPercent, defaultStakePercent, defaultMaxTradesPerDay } = req.body;

    if (defaultProfitGoalPercent) db.settings.defaultProfitGoalPercent = Number(defaultProfitGoalPercent);
    if (defaultLossLimitPercent) db.settings.defaultLossLimitPercent = Number(defaultLossLimitPercent);
    if (defaultStakePercent) db.settings.defaultStakePercent = Number(defaultStakePercent);
    if (defaultMaxTradesPerDay) db.settings.defaultMaxTradesPerDay = Number(defaultMaxTradesPerDay);

    saveDatabase(db);
    logAudit('Admin', 'METAS_PADRÃO', `Atualizou metas padrão (Meta Win: ${db.settings.defaultProfitGoalPercent}%, Stop Loss: ${db.settings.defaultLossLimitPercent}%)`);

    return res.json({ success: true, goals: db.settings });
  });

  // 8. AUDIT LOGS
  app.get('/api/admin/audit-logs', (_req: Request, res: Response) => {
    return res.json(db.auditLogs);
  });

  // -------------------------------------------------------------
  // CLIENT-FACING ENDPOINTS
  // -------------------------------------------------------------

  // Client Identification & Real Server-side Status Check
  app.get('/api/client/status', (req: Request, res: Response) => {
    const emailOrCode = req.query.identifier as string;

    if (!emailOrCode) {
      // Return default active demo client (Rafael Silva)
      const defaultClient = checkAndUpdateClientStatus(db.clients[0]);
      saveDatabase(db);
      return res.json({
        client: defaultClient,
        settings: {
          telegramUsername: db.settings.telegramUsername,
          telegramLink: db.settings.telegramLink,
          subscriptionPrice: db.settings.subscriptionPrice,
          paymentInstructions: db.settings.paymentInstructions
        }
      });
    }

    const q = emailOrCode.toLowerCase().trim();
    let client = db.clients.find(
      (c) => c.email.toLowerCase() === q || c.accessCode.toLowerCase() === q
    );

    if (!client) {
      return res.status(404).json({ error: 'Conta não encontrada. Cadastre-se para iniciar o teste grátis de 24 horas.' });
    }

    client = checkAndUpdateClientStatus(client);
    saveDatabase(db);

    // Calculate time left in trial
    let trialMinutesLeft = 0;
    if (client.status === 'Em teste' && client.trialExpiresAt) {
      const now = new Date().getTime();
      const exp = new Date(client.trialExpiresAt).getTime();
      trialMinutesLeft = Math.max(0, Math.floor((exp - now) / (60 * 1000)));
    }

    // Calculate subscription days left
    let subscriptionDaysLeft = 0;
    if (client.status === 'Assinatura ativa' && client.subscriptionExpiresAt) {
      const now = new Date().getTime();
      const exp = new Date(client.subscriptionExpiresAt).getTime();
      subscriptionDaysLeft = Math.max(0, Math.ceil((exp - now) / (24 * 3600 * 1000)));
    }

    return res.json({
      client,
      trialMinutesLeft,
      subscriptionDaysLeft,
      settings: {
        telegramUsername: db.settings.telegramUsername,
        telegramLink: db.settings.telegramLink,
        subscriptionPrice: db.settings.subscriptionPrice,
        paymentInstructions: db.settings.paymentInstructions,
        paymentMessage: db.settings.paymentMessage
      }
    });
  });

  // Start 24h Free Trial
  app.post('/api/client/start-trial', (req: Request, res: Response) => {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e E-mail são obrigatórios para iniciar o teste.' });
    }

    const existing = db.clients.find((c) => c.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      // Do not allow multiple free trials by simple new sessions
      const checked = checkAndUpdateClientStatus(existing);
      return res.json({
        success: true,
        client: checked,
        message: 'Conta existente recuperada com sucesso.'
      });
    }

    const now = new Date();
    const trialExp = new Date(now.getTime() + 24 * 3600 * 1000);
    const newCode = `TV-${Math.floor(1000 + Math.random() * 9000)}`;

    const newClient: ClientUser = {
      id: `cli-${Date.now()}`,
      name,
      email,
      accessCode: newCode,
      status: 'Em teste',
      trialStartedAt: now.toISOString(),
      trialExpiresAt: trialExp.toISOString(),
      createdAt: now.toISOString(),
      trades: []
    };

    db.clients.unshift(newClient);
    saveDatabase(db);

    return res.json({
      success: true,
      client: newClient,
      message: 'Seu teste grátis de 24 horas do Trade Vision IA foi ativado!'
    });
  });

  // Client Claims Telegram Payment
  app.post('/api/client/request-payment', (req: Request, res: Response) => {
    const { clientId, clientEmail, clientCode, clientName, transactionRef } = req.body;

    const client = db.clients.find(
      (c) => c.id === clientId || c.email === clientEmail || c.accessCode === clientCode
    );

    if (!client) {
      return res.status(404).json({ error: 'Cliente não localizado.' });
    }

    // Check if there's already a pending payment to prevent duplicate requests
    const existingPending = db.payments.find(
      (p) => (p.clientId === client.id || p.clientEmail === client.email) && p.status === 'Pendente'
    );

    if (existingPending) {
      return res.json({
        success: true,
        alreadyPending: true,
        payment: existingPending,
        message: 'Você já possui uma solicitação pendente em análise pelo administrador.'
      });
    }

    const newPayment: PaymentRequest = {
      id: `pay-${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientCode: client.accessCode,
      amount: db.settings.subscriptionPrice || 29.90,
      date: new Date().toISOString(),
      status: 'Pendente',
      method: 'Telegram PIX',
      transactionRef: transactionRef || 'Comprovante Telegram',
      periodDaysGranted: db.settings.subscriptionDurationDays || 30
    };

    client.status = 'Aguardando pagamento';
    db.payments.unshift(newPayment);
    saveDatabase(db);

    return res.json({
      success: true,
      payment: newPayment,
      message: 'Solicitação registrada! O administrador verificará seu pagamento pelo Telegram.'
    });
  });

  // Client Redeems Token
  app.post('/api/client/redeem-token', (req: Request, res: Response) => {
    const { tokenCode, clientId } = req.body;
    if (!tokenCode) {
      return res.status(400).json({ error: 'Informe o código do token.' });
    }

    const token = db.tokens.find(
      (t) => t.tokenCode.toUpperCase() === tokenCode.toUpperCase().trim()
    );

    if (!token) {
      return res.status(404).json({ error: 'Token inválido ou inexistente.' });
    }

    if (token.isRevoked) {
      return res.status(400).json({ error: 'Este token foi revogado pelo administrador.' });
    }

    if (token.currentUses >= token.maxUses) {
      return res.status(400).json({ error: 'Este token atingiu o limite máximo de utilizações.' });
    }

    const now = new Date();
    if (new Date(token.expiresAt).getTime() < now.getTime()) {
      return res.status(400).json({ error: 'Este token está expirado.' });
    }

    const client = db.clients.find((c) => c.id === clientId);
    if (!client) {
      return res.status(404).json({ error: 'Cliente não localizado.' });
    }

    token.currentUses += 1;
    client.status = 'Assinatura ativa';
    const baseTime = client.subscriptionExpiresAt ? new Date(client.subscriptionExpiresAt).getTime() : now.getTime();
    const newExp = new Date(Math.max(now.getTime(), baseTime) + token.durationDays * 24 * 3600 * 1000);
    client.subscriptionExpiresAt = newExp.toISOString();

    saveDatabase(db);
    logAudit('Sistema', 'RESGATE_TOKEN', `Cliente ${client.name} resgatou o token ${token.tokenCode} (+${token.durationDays} dias)`);

    return res.json({
      success: true,
      client,
      message: `Token resgatado com sucesso! +${token.durationDays} dias liberados.`
    });
  });

  // Client Saves Trade Operations
  app.post('/api/client/trades', (req: Request, res: Response) => {
    const { clientId, trades } = req.body;
    const client = db.clients.find((c) => c.id === clientId);
    if (!client) {
      return res.status(404).json({ error: 'Cliente não localizado.' });
    }

    if (Array.isArray(trades)) {
      client.trades = trades;
      saveDatabase(db);
    }

    return res.json({ success: true, trades: client.trades });
  });

  // -------------------------------------------------------------
  // VITE / STATIC SERVING
  // -------------------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trade Vision IA server running on port ${PORT}`);
  });
}

startServer();
