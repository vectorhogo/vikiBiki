import React, { useState, useRef } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  Users,
  Plus,
  ShieldCheck,
  RefreshCw,
  Trash2,
  HardDrive,
  Download,
  RotateCcw,
  FolderArchive,
  AlertTriangle,
  Lock,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import { toPersianDigits } from '../utils/formatters';
import { BackupFolderModal } from './BackupFolderModal';
import { TotpSetupModal } from './TotpSetupModal';
import { BackupCatalogEntry } from '../utils/backupEngine';

export const SettingsView: React.FC = () => {
  const {
    personnel,
    addPerson,
    archivePerson,
    formatActivationTime,
    resetAllData,
    lastBackupInfo,
    createManualBackup,
    restoreBackup,
    lockApplication,
    currentTotpSecret,
    setupTotp,
  } = useAccounting();

  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');

  // Backup & Security modal states
  const [isBackupFolderOpen, setIsBackupFolderOpen] = useState(false);
  const [isTotpModalOpen, setIsTotpModalOpen] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addPerson({
      name: name.trim(),
      role: role.trim() || 'پرسنل اداری و اجرایی',
      phone: phone.trim() || 'ثبت نشده',
    });

    setName('');
    setRole('');
    setPhone('');
    setIsAddingPerson(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setPendingRestoreFile(file);
    // Reset file input value so user can select same file again if needed
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreFile) return;
    setIsRestoring(true);
    await restoreBackup(pendingRestoreFile);
    setIsRestoring(false);
    setPendingRestoreFile(null);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto" dir="rtl">
      {/* Hidden file input for restore */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".zip"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="bg-[#17181d] border border-[#26282e] p-4 rounded-xl">
        <h1 className="text-base sm:text-lg font-bold text-zinc-100">تنظیمات، امنیت و پشتیبان‌گیری</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          مدیریت پرسنل، چرخه پشتیبان‌گیری فشرده، نگهداری نسخه‌ها و احراز هویت Google Authenticator
        </p>
      </div>

      {/* Backup & Data Protection Section */}
      <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#26282e] flex items-center justify-between bg-[#141519]">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-zinc-200">پشتیبان‌گیری و حفاظت از داده‌ها</span>
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Status summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#131417] border border-[#24262e] rounded-xl">
            <div className="space-y-1">
              <span className="text-zinc-400">آخرین پشتیبان:</span>
              <div className="font-semibold text-zinc-200">
                {lastBackupInfo ? lastBackupInfo.date : 'هنوز پشتیبانی ایجاد نشده'}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-zinc-400">وضعیت:</span>
              <div className="flex items-center gap-1.5 font-semibold">
                {lastBackupInfo ? (
                  lastBackupInfo.status === 'valid' ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      معتبر
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      آخرین پشتیبان با مشکل مواجه شده
                    </span>
                  )
                ) : (
                  <span className="text-zinc-500">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              id="btn-manual-backup"
              onClick={() => createManualBackup()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>پشتیبان‌گیری الان</span>
            </button>

            <button
              id="btn-restore-backup"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[#20222a] hover:bg-[#2a2d36] text-zinc-200 border border-[#2e313b] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>بازیابی پشتیبان</span>
            </button>

            <button
              id="btn-open-backup-folder"
              onClick={() => setIsBackupFolderOpen(true)}
              className="px-4 py-2 bg-[#20222a] hover:bg-[#2a2d36] text-zinc-300 border border-[#2e313b] font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FolderArchive className="w-4 h-4 text-zinc-400" />
              <span>باز کردن پوشه پشتیبان‌ها</span>
            </button>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      {pendingRestoreFile && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-300 text-sm">تأیید عملیات بازیابی پشتیبان</div>
              <p className="text-zinc-300 text-xs leading-relaxed">
                با بازیابی پشتیبان، اطلاعات فعلی با نسخه انتخاب‌شده جایگزین می‌شود.
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                فایل انتخاب‌شده: {pendingRestoreFile.name} ({(pendingRestoreFile.size / 1024).toFixed(1)} کیلوبایت)
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={isRestoring}
              onClick={() => setPendingRestoreFile(null)}
              className="px-3.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={isRestoring}
              onClick={handleConfirmRestore}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isRestoring ? (
                <span>در حال بازیابی...</span>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تأیید و جایگزینی داده‌ها</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Security & 24-Hour Access Section */}
      <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#26282e] flex items-center justify-between bg-[#141519]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-zinc-200">امنیت و دسترسی ۲۴ ساعته</span>
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-zinc-400 leading-relaxed">
            برنامه بر پایه دوره دسترسی ۲۴ ساعته امن و قفل خودکار طراحی شده است. پس از انقضا یا قفل، با ورود کد ۶ رقمی از
            اپلیکیشن Google Authenticator مجدداً دسترسی بازگشایی می‌شود. هیچ داده‌ای با قفل شدن حذف یا پنهان نخواهد شد.
          </p>

          <div className="p-3 rounded-lg bg-[#141519] border border-[#22242a] flex items-center justify-between">
            <span className="text-zinc-400">مهلت استفاده باقیمانده:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm dir-ltr">{formatActivationTime()}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={() => setIsTotpModalOpen(true)}
              className="px-3.5 py-2 bg-[#20222a] hover:bg-[#2a2d36] text-zinc-200 border border-[#2e313b] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>اتصال یا تنظیم مجدد Google Authenticator</span>
            </button>

            <button
              onClick={() => lockApplication()}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              <span>قفل کردن برنامه اکنون</span>
            </button>
          </div>
        </div>
      </div>

      {/* Personnel Management */}
      <div className="bg-[#17181d] border border-[#26282e] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#26282e] flex items-center justify-between bg-[#141519]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-zinc-200">فهرست پرسنل و مسئولین تنخواه</span>
          </div>

          <button
            onClick={() => setIsAddingPerson(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن شخص جدید</span>
          </button>
        </div>

        {/* Add Person Form */}
        {isAddingPerson && (
          <form onSubmit={handleAddPerson} className="p-4 bg-[#1b1d24] border-b border-[#26282e] space-y-3 text-xs">
            <div className="font-semibold text-zinc-200 text-xs">ثبت مشخصات پرسنل جدید:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1">نام و نام خانوادگی *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: رضا نادری"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#131417] border border-[#2e313a] rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">سمت یا مسئولیت</label>
                <input
                  type="text"
                  placeholder="مثال: کارشناس فنی، راننده، تحصیل‌دار"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#131417] border border-[#2e313a] rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">شماره تماس</label>
                <input
                  type="text"
                  placeholder="مثال: ۰۹۱۲..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#131417] border border-[#2e313a] rounded-lg px-3 py-1.5 text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingPerson(false)}
                className="px-3 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition-colors"
              >
                ذخیره پرسنل
              </button>
            </div>
          </form>
        )}

        {/* Personnel List Table */}
        <div className="divide-y divide-[#22242a] text-xs">
          {personnel
            .filter((p) => p.status === 'active')
            .map((person) => (
              <div key={person.id} className="p-3.5 flex items-center justify-between hover:bg-[#1a1c22] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#202229] border border-[#2c2f38] flex items-center justify-center font-bold text-amber-400 text-xs">
                    {person.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-bold text-zinc-100">{person.name}</div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                      <span>{person.role}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="font-mono text-zinc-400">{person.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (window.confirm(`آیا از حذف یا آرشیو ${person.name} اطمینان دارید؟`)) {
                        archivePerson(person.id);
                      }
                    }}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 rounded hover:bg-[#252831] transition-colors"
                    title="آرشیو"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Reset System Data */}
      <div className="p-4 rounded-xl bg-[#17181d] border border-[#26282e] space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-zinc-400" />
          <h2 className="text-xs sm:text-sm font-bold text-zinc-200">بازنشانی داده‌ها</h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          در صورت تمایل می‌توانید کلیه هزینه‌ها، تنخواه‌ها و خودروها را به مقادیر اولیه نمونه سیستم بازگردانید.
        </p>

        <button
          onClick={() => {
            if (window.confirm('آیا از بازنشانی داده‌ها به اطلاعات اولیه مطمئن هستید؟')) {
              resetAllData();
            }
          }}
          className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 rounded-lg text-xs font-semibold transition-colors cursor-pointer self-start flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>بازنشانی به داده‌های نمونه</span>
        </button>
      </div>

      {/* Modals */}
      <BackupFolderModal
        isOpen={isBackupFolderOpen}
        onClose={() => setIsBackupFolderOpen(false)}
        onDownloadCurrentState={() => createManualBackup()}
      />

      <TotpSetupModal
        isOpen={isTotpModalOpen}
        onClose={() => setIsTotpModalOpen(false)}
        currentSecret={currentTotpSecret}
        onSetupSuccess={async (newSecret) => {
          await setupTotp(newSecret);
        }}
      />
    </div>
  );
};
