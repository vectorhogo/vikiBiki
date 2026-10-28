import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { UserRole } from '../types/patch09c';
import { ROLE_DEFINITIONS } from '../utils/rbacEngine';
import { toPersianDigits } from '../utils/formatters';
import {
  ShieldCheck,
  User,
  CheckCircle2,
  Lock,
  History,
  X,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

interface UserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTotpSetup?: () => void;
}

export const UserRoleModal: React.FC<UserRoleModalProps> = ({
  isOpen,
  onClose,
  onOpenTotpSetup,
}) => {
  const { currentUser, setCurrentUserRole, auditLogs, showToast } = useAccounting();
  const [activeTab, setActiveTab] = useState<'roles' | 'audit'>('roles');

  if (!isOpen) return null;

  const currentRoleInfo = ROLE_DEFINITIONS[currentUser.role];

  const handleSelectRole = (role: UserRole) => {
    setCurrentUserRole(role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-[#18191e] border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-sm">کنترل دسترسی مبتنی بر نقش (RBAC) و امنیت</h3>
              <p className="text-[11px] text-zinc-400">پروفایل کاربری فعال و تاریخچه وقایع امنیتی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/30 text-xs">
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex-1 py-2.5 font-semibold transition-colors cursor-pointer text-center ${
              activeTab === 'roles'
                ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            نقش‌های کاربری و دسترسی‌ها
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-2.5 font-semibold transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'audit'
                ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>ردپای حسابرسی و وقایع ({toPersianDigits(auditLogs.length)})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'roles' ? (
            <>
              {/* Current Active User Banner */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-zinc-100 text-sm block">{currentUser.fullName}</strong>
                    <span className="text-zinc-400 text-[11px]">کاربر جاری سیستم اتو عبداللهی</span>
                  </div>
                </div>

                <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${currentRoleInfo.badgeColor}`}>
                  {currentRoleInfo.title}
                </span>
              </div>

              {/* Roles Selection */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-semibold text-zinc-400 block">
                  انتخاب نقش کاربری (تغییر سطح دسترسی در این سشن):
                </span>

                {(Object.keys(ROLE_DEFINITIONS) as UserRole[]).map((r) => {
                  const rInfo = ROLE_DEFINITIONS[r];
                  const isSelected = currentUser.role === r;

                  return (
                    <div
                      key={r}
                      onClick={() => handleSelectRole(r)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-xs'
                          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-amber-400 bg-amber-500' : 'border-zinc-600'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </div>
                          <span className="font-bold text-zinc-100 text-xs">{rInfo.title}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${rInfo.badgeColor}`}>
                          {toPersianDigits(rInfo.permissions.length)} مجوز
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed pr-6">
                        {rInfo.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Active Permissions List */}
              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                <span className="font-bold text-zinc-300 block text-xs">مجوزهای فعال برای نقش جاری:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>ثبت و کارشناسی خودروها</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>مشاهده پرونده مشتریان</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {currentRoleInfo.permissions.includes('view_financials') ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    )}
                    <span className={currentRoleInfo.permissions.includes('view_financials') ? '' : 'text-zinc-500'}>
                      مشاهده ارقام سود و زیان
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {currentRoleInfo.permissions.includes('edit_financials') ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    )}
                    <span className={currentRoleInfo.permissions.includes('edit_financials') ? '' : 'text-zinc-500'}>
                      ثبت و تغییر هزینه و دریافت‌ها
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {currentRoleInfo.permissions.includes('close_reopen_period') ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    )}
                    <span className={currentRoleInfo.permissions.includes('close_reopen_period') ? '' : 'text-zinc-500'}>
                      بستن دوره مالی و افتتاحیه
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {currentRoleInfo.permissions.includes('delete_sensitive_records') ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    )}
                    <span className={currentRoleInfo.permissions.includes('delete_sensitive_records') ? '' : 'text-zinc-500'}>
                      حذف پرونده یا ابطال اسناد
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Audit Log Trail */
            <div className="space-y-2.5">
              <span className="text-[11px] text-zinc-400 block">
                گزارش شفاف کلیه تغییرات مهم، نقل و انتقالات و عملیات‌های سیستمی:
              </span>

              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">هیچ رکوردی در تاریخچه ثبت نشده است.</div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-zinc-200 font-bold">{log.action}</strong>
                      <span className="text-zinc-500 font-en-num text-[10px]">{toPersianDigits(log.timestamp)}</span>
                    </div>
                    {log.entityTitle && (
                      <div className="text-amber-300 font-medium text-[11px]">{log.entityTitle}</div>
                    )}
                    {log.details && <p className="text-zinc-400 leading-normal">{log.details}</p>}
                    <div className="flex items-center gap-2 pt-1 text-[10px] text-zinc-500 border-t border-zinc-800/60">
                      <span>کاربر: {log.userName}</span>
                      <span>•</span>
                      <span>نقش: {ROLE_DEFINITIONS[log.userRole]?.title || log.userRole}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>مهلت لایسنس فعال: ۲۴ ساعت</span>
          </div>

          <button
            onClick={onClose}
            className="btn-minimal px-4 py-1.5 rounded-xl text-xs cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
