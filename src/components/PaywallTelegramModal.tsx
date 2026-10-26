import React, { useState } from 'react';
import {
  Lock,
  Send,
  CheckCircle,
  Clock,
  Sparkles,
  Key,
  ShieldCheck,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface PaywallTelegramModalProps {
  isOpen: boolean;
  onClose?: () => void;
  clientName?: string;
  clientEmail?: string;
  clientCode?: string;
  clientId?: string;
  subscriptionPrice?: number;
  telegramLink?: string;
  telegramUsername?: string;
  paymentInstructions?: string;
  onRedeemToken?: (code: string) => Promise<{ success: boolean; message: string }>;
  onRequestPayment?: (ref?: string) => Promise<{ success: boolean; message: string }>;
  isPendingPayment?: boolean;
}

export const PaywallTelegramModal: React.FC<PaywallTelegramModalProps> = ({
  isOpen,
  clientName,
  clientEmail,
  clientCode = 'TV-4412',
  subscriptionPrice = 29.90,
  telegramLink = 'https://t.me/tradevision_oficial',
  telegramUsername = '@tradevision_oficial',
  paymentInstructions,
  onRedeemToken,
  onRequestPayment,
  isPendingPayment = false
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenFeedback, setTokenFeedback] = useState<{ success: boolean; text: string } | null>(null);

  const [paymentRequested, setPaymentRequested] = useState(isPendingPayment);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenTelegram = () => {
    const defaultMsg = encodeURIComponent(
      `Olá! Gostaria de assinar o Trade Vision IA (R$ ${subscriptionPrice.toFixed(2)}). Meu código de conta é: ${clientCode} (${clientEmail || ''})`
    );
    const url = telegramLink.startsWith('http')
      ? `${telegramLink}?text=${defaultMsg}`
      : `https://t.me/${telegramUsername.replace('@', '')}?text=${defaultMsg}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleClaimPayment = async () => {
    if (onRequestPayment) {
      setPaymentLoading(true);
      const res = await onRequestPayment();
      setPaymentLoading(false);
      if (res.success) {
        setPaymentRequested(true);
        setPaymentFeedback(res.message);
      }
    } else {
      setPaymentRequested(true);
      setPaymentFeedback('Solicitação enviada com sucesso! O administrador verificará seu pagamento pelo Telegram.');
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() || !onRedeemToken) return;

    setTokenLoading(true);
    setTokenFeedback(null);
    const res = await onRedeemToken(tokenInput.trim());
    setTokenLoading(false);
    setTokenFeedback({ success: res.success, text: res.message });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-950 border-2 border-pink-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-pink-500/10 space-y-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Icon and Header */}
        <div className="text-center space-y-3 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-pink-500/30 text-white">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Seu período de teste grátis terminou!
          </h2>

          <p className="text-sm text-zinc-300 leading-relaxed max-w-md mx-auto">
            Continue utilizando o <strong className="text-pink-400">Trade Vision IA</strong> assinando o plano mensal por apenas{' '}
            <span className="font-extrabold text-white bg-pink-950/60 px-2 py-0.5 rounded border border-pink-500/40">
              R$ {subscriptionPrice.toFixed(2)}
            </span>.
          </p>

          <p className="text-xs text-zinc-400">
            Entre em contato pelo nosso Telegram para realizar o pagamento e solicitar a liberação do seu acesso.
          </p>
        </div>

        {/* Client Identification Box */}
        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs flex items-center justify-between text-zinc-300">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Seu Código de Conta</span>
            <span className="font-mono text-sm font-black text-pink-400">{clientCode}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Titular</span>
            <span className="font-bold text-white">{clientName || 'Cliente Trade Vision'}</span>
          </div>
        </div>

        {/* Instructions */}
        {paymentInstructions && (
          <div className="p-3.5 rounded-xl bg-pink-950/20 border border-pink-500/30 text-xs text-zinc-300 space-y-1">
            <strong className="text-pink-300 font-bold block">Instruções de Pagamento:</strong>
            <p className="text-zinc-400">{paymentInstructions}</p>
          </div>
        )}

        {/* Pending Status Alert */}
        {paymentRequested && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs space-y-1.5 animate-pulse">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <Clock className="w-4 h-4" />
              <span>Solicitação de Liberação em Análise</span>
            </div>
            <p>
              {paymentFeedback ||
                'Sua solicitação de pagamento foi registrada no sistema do administrador. Assim que conferido no Telegram, seu acesso será liberado automaticamente por 30 dias.'}
            </p>
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Button 1: Open Telegram */}
          <button
            onClick={handleOpenTelegram}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-pink-600/30 active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Pagar e liberar acesso pelo Telegram ({telegramUsername})</span>
          </button>

          {/* Button 2: Already Paid Claim */}
          <button
            onClick={handleClaimPayment}
            disabled={paymentLoading || paymentRequested}
            className="w-full py-3 px-5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-zinc-200 border border-zinc-700/80 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>
              {paymentRequested ? 'Pagamento Informado (Em Verificação)' : 'Já realizei o pagamento'}
            </span>
          </button>
        </div>

        {/* Access Token Redemption (Alternative) */}
        <div className="pt-4 border-t border-zinc-800 space-y-2.5">
          <span className="text-xs text-zinc-400 font-semibold block flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-pink-400" />
            Possui um Código de Acesso / Token de Liberação?
          </span>

          <form onSubmit={handleRedeem} className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: TV-VIP-30D"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-white uppercase placeholder-zinc-500 outline-none focus:border-pink-500"
            />
            <button
              type="submit"
              disabled={tokenLoading || !tokenInput.trim()}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-xs shrink-0 cursor-pointer"
            >
              {tokenLoading ? 'Validando...' : 'Resgatar'}
            </button>
          </form>

          {tokenFeedback && (
            <div
              className={`p-2.5 rounded-lg text-xs font-semibold ${
                tokenFeedback.success
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40'
                  : 'bg-red-950/40 text-red-300 border border-red-500/40'
              }`}
            >
              {tokenFeedback.text}
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="text-center pt-2 text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Acesso seguro com liberação de 30 dias confirmada pelo administrador</span>
        </div>
      </div>
    </div>
  );
};
