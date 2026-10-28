import React, { useState, useRef, useEffect } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { AiChatMessage, AiSuggestedAction } from '../types/patch09c';
import { processAiQuery } from '../utils/aiOperationsEngine';
import { formatToman, toPersianDigits } from '../utils/formatters';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  Calendar,
  Car,
  Users,
  Coins,
  Wallet,
  CheckCircle2,
} from 'lucide-react';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any, params?: any) => void;
  onOpenCustomerDrawer?: (customerId: string) => void;
  onOpenVehicleDrawer?: (vehicleId: string) => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenCustomerDrawer,
  onOpenVehicleDrawer,
}) => {
  const {
    contracts,
    customers,
    vehicles,
    expiringDocs,
    consignmentAgreements,
    ownerSettlements,
    financialAccounts,
    dealCommissions,
    investorProfiles,
    showToast,
  } = useAccounting();

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      text: 'سلام! من دستیار هوشمند عملیاتی اتو عبداللهی هستم. تمام پردازش‌ها به‌صورت ۱۰۰٪ آفلاین و محلی درون سیستم شما انجام می‌شوند. می‌توانید درباره اقساط، وکالت‌نامه‌ها، بیمه‌ها، مشتریان و گزارش‌های مالی سوال بفرمایید.',
    },
  ]);

  const [pendingAction, setPendingAction] = useState<AiSuggestedAction | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const presetQueries = [
    'اقساط عقب‌افتاده این هفته را نشان بده',
    'کدام وکالت‌ها در هفت روز آینده منقضی می‌شوند؟',
    'پرونده مشتری محمد رضایی را پیدا کن',
    'گزارش تسویه‌نشده‌های خودروهای امانی را آماده کن',
    'وضعیت بیمه خودروهای موجود را بررسی کن',
    'موجودی حساب‌های بانکی چقدر است؟',
    'کمیسیون‌های دریافت‌نشده را فهرست کن',
    'سرمایه سرمایه‌گذاران چقدر است؟',
  ];

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    // Process NLP locally
    const result = processAiQuery(query, {
      contracts,
      customers,
      vehicles,
      expiringDocs,
      consignmentAgreements,
      ownerSettlements,
      financialAccounts,
      dealCommissions,
      investors: investorProfiles,
    });

    const assistantMsg: AiChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      text: result.text,
      dataSummary: result.summaryData,
      suggestedAction: result.suggestedAction,
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, assistantMsg]);
    }, 150);
  };

  const handleExecuteAction = (action: AiSuggestedAction) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
      return;
    }
    executeConfirmedAction(action);
  };

  const executeConfirmedAction = (action: AiSuggestedAction) => {
    if (action.actionType === 'navigate_report') {
      onNavigateTab(action.targetTab || 'reports', action.payload);
      onClose();
    } else if (action.actionType === 'navigate_customer' && action.targetId) {
      if (onOpenCustomerDrawer) {
        onOpenCustomerDrawer(action.targetId);
      } else {
        onNavigateTab('customers');
      }
      onClose();
    } else if (action.actionType === 'navigate_vehicle' && action.targetId) {
      if (onOpenVehicleDrawer) {
        onOpenVehicleDrawer(action.targetId);
      } else {
        onNavigateTab('vehicles');
      }
      onClose();
    } else {
      showToast(action.description, 'info');
    }
    setPendingAction(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="w-full max-w-md bg-[#16171c] border-l border-zinc-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-black font-bold">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <span>دستیار عملیاتی هوشمند</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-normal">
                  آفلاین
                </span>
              </h2>
              <p className="text-[10px] text-zinc-400">جستجو، خلاصه وضعیت و اقدام سریع با زبان طبیعی</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message history */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {msg.sender === 'user' ? (
                  <>
                    <span className="text-[10px] text-zinc-500 font-en-num">{msg.timestamp}</span>
                    <span className="text-[11px] font-bold text-amber-400">شما</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-bold text-zinc-300">دستیار اتو عبداللهی</span>
                    <span className="text-[10px] text-zinc-500 font-en-num">{msg.timestamp}</span>
                  </>
                )}
              </div>

              <div
                className={`p-3 rounded-2xl max-w-[92%] leading-relaxed whitespace-pre-line text-xs ${
                  msg.sender === 'user'
                    ? 'bg-amber-500/15 text-zinc-100 border border-amber-500/30 rounded-tl-xs'
                    : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800 rounded-tr-xs shadow-xs'
                }`}
              >
                <p>{msg.text}</p>

                {/* Overdue Installments Summary Cards */}
                {msg.dataSummary?.type === 'overdue_installments' && msg.dataSummary.items && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-800 space-y-1.5">
                    {msg.dataSummary.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-[11px] flex justify-between items-center"
                      >
                        <div>
                          <strong className="text-zinc-200 block">{item.customerName}</strong>
                          <span className="text-zinc-500 font-mono text-[10px]">{item.contractNumber}</span>
                        </div>
                        <div className="text-left font-en-num">
                          <span className="text-amber-400 font-bold block">{formatToman(item.remainingAmount)}</span>
                          <span className="text-zinc-500 text-[10px]">{toPersianDigits(item.dueDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expiring Docs Summary Cards */}
                {msg.dataSummary?.type === 'expiring_docs' && msg.dataSummary.items && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-800 space-y-1.5">
                    {msg.dataSummary.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-zinc-950/60 border border-amber-500/20 text-[11px] flex justify-between items-center"
                      >
                        <div>
                          <strong className="text-zinc-200 block">{item.title}</strong>
                          <span className="text-zinc-400 text-[10px]">{item.vehicleLabel}</span>
                        </div>
                        <div className="text-left font-en-num">
                          <span className="text-amber-300 font-bold block text-[10px]">انقضا: {toPersianDigits(item.expiryDate)}</span>
                          <span className="text-zinc-500 font-mono text-[10px]">{item.documentNumber}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bank Balances Summary */}
                {msg.dataSummary?.type === 'bank_balances' && msg.dataSummary.items && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-800 space-y-1.5">
                    {msg.dataSummary.items.map((acc: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-[11px] flex justify-between items-center"
                      >
                        <span className="text-zinc-200 font-medium">{acc.name}</span>
                        <span className="font-en-num font-bold text-sky-300">{formatToman(acc.currentBalance || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Action Trigger Button */}
                {msg.suggestedAction && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800">
                    <button
                      onClick={() => handleExecuteAction(msg.suggestedAction!)}
                      className="w-full btn-minimal-amber py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer"
                    >
                      <span>{msg.suggestedAction.title}</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                      {msg.suggestedAction.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions */}
        <div className="px-3 py-2 border-t border-zinc-800/80 bg-zinc-900/40">
          <span className="text-[10px] text-zinc-500 block mb-1.5">پیشنهادهای پرکاربرد:</span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {presetQueries.slice(0, 4).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 text-[11px] whitespace-nowrap border border-zinc-700/50 cursor-pointer transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Query input footer */}
        <div className="p-3 border-t border-zinc-800 bg-[#141519] flex items-center gap-2">
          <input
            type="text"
            placeholder="درخواست خود را بنویسید (مثال: اقساط معوق، وکالت‌ها...)"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 placeholder-zinc-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim()}
            className="p-2 rounded-xl bg-amber-500 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-400 cursor-pointer transition-colors"
            title="ارسال"
          >
            <Send className="w-4 h-4 -scale-x-100" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Sensitive / Financial Mutations */}
      {pendingAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-[#18191e] border border-amber-500/40 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-zinc-100">تأیید اقدام سیستمی</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              شما در حال اجرای عملیات <strong className="text-amber-300">«{pendingAction.title}»</strong> از طریق دستیار هوشمند هستید.
            </p>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
              {pendingAction.description}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setPendingAction(null)}
                className="btn-minimal px-3 py-1.5 rounded-lg text-xs cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={() => executeConfirmedAction(pendingAction)}
                className="btn-minimal-amber px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              >
                تأیید و اجرا
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
