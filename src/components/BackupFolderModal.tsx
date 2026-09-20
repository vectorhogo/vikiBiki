import React, { useState, useEffect } from 'react';
import { X, FolderArchive, Download, RotateCcw, AlertTriangle, CheckCircle2, HardDrive } from 'lucide-react';
import { getBackupCatalog, BackupCatalogEntry } from '../utils/backupEngine';
import { toPersianDigits } from '../utils/formatters';

interface BackupFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreEntry?: (entry: BackupCatalogEntry) => void;
  onDownloadCurrentState: () => void;
}

export const BackupFolderModal: React.FC<BackupFolderModalProps> = ({
  isOpen,
  onClose,
  onRestoreEntry,
  onDownloadCurrentState,
}) => {
  const [catalog, setCatalog] = useState<BackupCatalogEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<BackupCatalogEntry | null>(null);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCatalog(getBackupCatalog());
      setSelectedEntry(null);
      setShowConfirmRestore(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${toPersianDigits(bytes)} بایت`;
    if (bytes < 1024 * 1024) return `${toPersianDigits((bytes / 1024).toFixed(1))} کیلوبایت`;
    return `${toPersianDigits((bytes / (1024 * 1024)).toFixed(2))} مگابایت`;
  };

  const formatPersianDate = (timeVal: number | string) => {
    try {
      const d = new Date(timeVal);
      return toPersianDigits(
        d.toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch {
      return String(timeVal);
    }
  };

  const getReasonLabel = (type: string) => {
    switch (type) {
      case 'manual':
        return 'پشتیبان دستی';
      case 'hourly_checkpoint':
        return 'ذخیره خودکار دوره‌ای';
      case 'emergency_pre_restore':
        return 'پشتیبان اضطراری قبل از بازیابی';
      case 'auto_close':
        return 'پشتیبان هنگام خروج';
      default:
        return 'پشتیبان سیستم';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div
        id="modal-backup-folder"
        className="bg-[#18191e] border border-[#2d3038] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#26282e] flex items-center justify-between bg-[#141519]">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-100">پوشه پشتیبان‌های برنامه</h2>
              <p className="text-[11px] text-zinc-400">
                فهرست نسخه‌های پشتیبان فشرده (.zip) ذخیره‌شده بر اساس چرخه نگهداری
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#22242a] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
          {catalog.length === 0 ? (
            <div className="p-8 text-center space-y-2 border border-dashed border-[#2b2d35] rounded-xl">
              <HardDrive className="w-8 h-8 text-zinc-600 mx-auto" />
              <div className="text-zinc-300 font-semibold text-sm">هنوز پشتیبانی ایجاد نشده است</div>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                می‌توانید با استفاده از دکمه «پشتیبان‌گیری الان» یک نسخه پشتیبان امن و کامل تهیه کنید.
              </p>
              <button
                onClick={onDownloadCurrentState}
                className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>پشتیبان‌گیری الان</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-zinc-400 text-[11px] px-1">
                <span>تعداد نسخه‌های موجود در چرخه: {toPersianDigits(catalog.length)}</span>
                <span className="text-zinc-500">نگهداری: ۷ نسخه اخیر، ۱۴ روزانه، ۴ هفتگی</span>
              </div>

              <div className="divide-y divide-[#24262d] border border-[#252830] rounded-xl bg-[#141519] overflow-hidden">
                {catalog.map((entry) => (
                  <div
                    key={entry.filename}
                    className="p-3.5 flex items-center justify-between hover:bg-[#1a1c22] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-200 text-xs font-semibold dir-ltr text-right">
                          {entry.filename}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#22252c] text-zinc-300 border border-[#2e313b]">
                          {getReasonLabel(entry.manifest.type)}
                        </span>
                        {entry.manifest.status === 'valid' ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            معتبر
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-rose-400 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            خطا
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                        <span>زمان: {formatPersianDate(entry.createdAt)}</span>
                        <span>•</span>
                        <span>حجم: {entry.sizeFormatted || formatBytes(entry.zipSizeBytes)}</span>
                        <span>•</span>
                        <span>
                          تعداد رکوردها: {toPersianDigits(entry.manifest.recordCount)} مورد
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedEntry(entry);
                          setShowConfirmRestore(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#20222a] hover:bg-[#2a2d36] text-zinc-300 border border-[#2e313b] text-xs transition-colors cursor-pointer flex items-center gap-1"
                        title="بازیابی این نسخه"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>بازیابی</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Restore Prompt inside modal */}
          {showConfirmRestore && selectedEntry && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-300 text-xs">تأیید بازیابی نسخه پشتیبان:</div>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    با بازیابی پشتیبان، اطلاعات فعلی با نسخه انتخاب‌شده جایگزین می‌شود. یک نسخه اضطراری از داده‌های فعلی نیز
                    به طور خودکار ایجاد خواهد شد.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmRestore(false);
                    setSelectedEntry(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onRestoreEntry && selectedEntry) {
                      onRestoreEntry(selectedEntry);
                      setShowConfirmRestore(false);
                      onClose();
                    }
                  }}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  تأیید و جایگزینی اطلاعات
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#26282e] bg-[#141519] flex items-center justify-between">
          <button
            onClick={onDownloadCurrentState}
            className="px-3.5 py-1.5 rounded-lg bg-[#20222a] hover:bg-[#282b34] text-zinc-200 border border-[#2e313b] text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>ایجاد و ذخیره پشتیبان جدید (.zip)</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#252830] hover:bg-[#2c303a] text-zinc-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
