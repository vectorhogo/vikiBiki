import React, { useState } from 'react';
import { HandoverChecklistItem, ThreeStateCheck, ChecklistGroup } from '../types/consignment';
import { toPersianDigits } from '../utils/formatters';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Plus,
  Trash2,
  Camera,
  Image as ImageIcon,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface ThreeStateChecklistProps {
  items: HandoverChecklistItem[];
  onChangeItems: (items: HandoverChecklistItem[]) => void;
  readOnly?: boolean;
}

export const CHECKLIST_GROUP_CONFIG: Record<
  ChecklistGroup,
  { label: string; iconColor: string }
> = {
  wipers: { label: 'سیستم برف‌پاک‌کن و تیغه‌ها', iconColor: 'text-sky-400' },
  cameras: { label: 'دوربین‌ها و سامانه‌های دیداری', iconColor: 'text-indigo-400' },
  lighting_sensors: { label: 'سنسورها، روشنایی و آنتن', iconColor: 'text-amber-400' },
  tools_safety: { label: 'ابزار، زاپاس، جک و تجهیزات اضطراری', iconColor: 'text-rose-400' },
  keys_electronics: { label: 'ریموت‌ها، کلیدها و سیستم‌های صوتی/تصویری', iconColor: 'text-purple-400' },
  interior_comfort: { label: 'تجهیزات رفاهی، کفپوش و داخل کابین', iconColor: 'text-emerald-400' },
  exterior_other: { label: 'بدنه، سانروف و سایر اقلام', iconColor: 'text-cyan-400' },
};

export const ThreeStateChecklist: React.FC<ThreeStateChecklistProps> = ({
  items,
  onChangeItems,
  readOnly = false,
}) => {
  const [activeNoteItemId, setActiveNoteItemId] = useState<string | null>(null);
  const [activePhotoItemId, setActivePhotoItemId] = useState<string | null>(null);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customGroup, setCustomGroup] = useState<ChecklistGroup>('tools_safety');
  const [customQuantity, setCustomQuantity] = useState(1);

  // Group items
  const groups: ChecklistGroup[] = [
    'wipers',
    'cameras',
    'lighting_sensors',
    'tools_safety',
    'keys_electronics',
    'interior_comfort',
    'exterior_other',
  ];

  // Update a single item's state
  const handleSetState = (itemId: string, newState: ThreeStateCheck) => {
    if (readOnly) return;
    const updated = items.map((it) => {
      if (it.id === itemId) {
        return { ...it, state: newState };
      }
      return it;
    });
    onChangeItems(updated);
  };

  // Update quantity
  const handleSetQuantity = (itemId: string, quantity: number) => {
    if (readOnly) return;
    const updated = items.map((it) => {
      if (it.id === itemId) {
        return { ...it, quantity: Math.max(1, quantity) };
      }
      return it;
    });
    onChangeItems(updated);
  };

  // Update note
  const handleSetNote = (itemId: string, noteText: string) => {
    if (readOnly) return;
    const updated = items.map((it) => {
      if (it.id === itemId) {
        return { ...it, notes: noteText };
      }
      return it;
    });
    onChangeItems(updated);
  };

  // Attach photo
  const handlePhotoUpload = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const url = evt.target?.result as string;
      if (url) {
        const updated = items.map((it) => {
          if (it.id === itemId) {
            return { ...it, photoUrl: url, photoName: file.name };
          }
          return it;
        });
        onChangeItems(updated);
        setActivePhotoItemId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add custom item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newItem: HandoverChecklistItem = {
      id: `chk-custom-${Date.now()}`,
      title: customTitle.trim(),
      group: customGroup,
      state: 'present',
      quantity: customQuantity || 1,
    };

    onChangeItems([...items, newItem]);
    setCustomTitle('');
    setCustomQuantity(1);
    setIsAddingCustom(false);
  };

  // Remove custom item
  const handleRemoveItem = (itemId: string) => {
    if (readOnly) return;
    if (window.confirm('آیا از حذف این قلم از چک‌لیست اطمینان دارید؟')) {
      onChangeItems(items.filter((it) => it.id !== itemId));
    }
  };

  // Metrics
  const totalCount = items.length;
  const presentCount = items.filter((it) => it.state === 'present').length;
  const missingCount = items.filter((it) => it.state === 'missing').length;
  const damagedCount = items.filter((it) => it.state === 'damaged').length;
  const uninspectedCount = items.filter((it) => it.state === 'uninspected').length;
  const inspectedCount = totalCount - uninspectedCount;

  return (
    <div className="space-y-4 select-none" dir="rtl">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#131418] p-3.5 rounded-2xl border border-[#262833]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-zinc-100">
                چک‌لیست اقلام و تحویل تجهیزات خودرو (Handover Checklist)
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                {toPersianDigits(inspectedCount)} / {toPersianDigits(totalCount)} بررسی‌شده
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              ثبت دقیق وضعیت سه حالته: <strong className="text-emerald-400">دارد</strong>،{' '}
              <strong className="text-rose-400">ندارد</strong> (تحویل نشد) یا{' '}
              <strong className="text-amber-400">خراب</strong> (موجود اما معیوب)
            </p>
          </div>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={() => setIsAddingCustom(!isAddingCustom)}
            className="px-3 py-1.5 bg-[#20222a] hover:bg-[#2b2e3a] text-zinc-200 border border-[#2f3240] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>افزودن قلم سفارشی</span>
          </button>
        )}
      </div>

      {/* Completion Progress & Pill Counters */}
      <div className="bg-[#15161c] border border-[#272935] p-3 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-[11px]">
              اقلام بررسی‌شده:{' '}
              <strong className="text-zinc-100 font-mono">
                {toPersianDigits(inspectedCount)} / {toPersianDigits(totalCount)}
              </strong>
            </span>
            {uninspectedCount > 0 && (
              <span className="text-amber-400/90 text-[11px]">
                ({toPersianDigits(uninspectedCount)} مورد هنوز بررسی نشده)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {toPersianDigits(presentCount)} موجود
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30">
              {toPersianDigits(missingCount)} ندارد
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {toPersianDigits(damagedCount)} خراب
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${(presentCount / totalCount) * 100}%` }}
            className="bg-emerald-500 h-full transition-all duration-300"
          />
          <div
            style={{ width: `${(damagedCount / totalCount) * 100}%` }}
            className="bg-amber-500 h-full transition-all duration-300"
          />
          <div
            style={{ width: `${(missingCount / totalCount) * 100}%` }}
            className="bg-rose-500 h-full transition-all duration-300"
          />
        </div>
      </div>

      {/* Custom Item Form */}
      {isAddingCustom && (
        <form
          onSubmit={handleAddCustomItem}
          className="p-3.5 bg-[#171821] border border-amber-500/30 rounded-xl space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-300">
            <span>افزودن قلم جدید به چک‌لیست تحویل</span>
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="text-zinc-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 block mb-1">عنوان قلم:</span>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="مثال: شارژر فندکی، کابل AUX..."
                className="w-full bg-[#111216] border border-[#2b2e3c] rounded-lg px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 block mb-1">دسته‌بندی:</span>
              <select
                value={customGroup}
                onChange={(e) => setCustomGroup(e.target.value as ChecklistGroup)}
                className="w-full bg-[#111216] border border-[#2b2e3c] rounded-lg px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
              >
                {Object.entries(CHECKLIST_GROUP_CONFIG).map(([k, cfg]) => (
                  <option key={k} value={k}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 block mb-1">تعداد:</span>
              <input
                type="number"
                min={1}
                value={customQuantity}
                onChange={(e) => setCustomQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#111216] border border-[#2b2e3c] rounded-lg px-2.5 py-1.5 text-zinc-100 text-xs font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="px-3 py-1 text-xs text-zinc-400 hover:text-white"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg"
            >
              افزودن قلم
            </button>
          </div>
        </form>
      )}

      {/* Grouped Checklist Tables */}
      <div className="space-y-3.5">
        {groups.map((groupKey) => {
          const groupItems = items.filter((it) => it.group === groupKey);
          if (groupItems.length === 0) return null;
          const groupCfg = CHECKLIST_GROUP_CONFIG[groupKey];

          return (
            <div
              key={groupKey}
              className="bg-[#14151a] border border-[#262833] rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Group Header */}
              <div className="px-4 py-2.5 bg-[#171820] border-b border-[#242631] flex items-center justify-between text-xs font-bold text-zinc-200">
                <span className={`flex items-center gap-2 ${groupCfg.iconColor}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  <span>{groupCfg.label}</span>
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {toPersianDigits(groupItems.length)} قلم
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#20222a]">
                {groupItems.map((item) => {
                  const isNoteOpen = activeNoteItemId === item.id;
                  const isPhotoOpen = activePhotoItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-3 sm:px-4 hover:bg-[#181920] transition-colors space-y-2 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        {/* Title + Quantity */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-zinc-100 text-xs sm:text-sm">
                            {item.title}
                          </span>

                          {/* Quantity pill/changer */}
                          <div className="flex items-center gap-1 bg-[#1e2029] px-2 py-0.5 rounded-lg border border-[#2b2e3c] text-[11px] text-zinc-400">
                            <span>تعداد:</span>
                            {!readOnly ? (
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleSetQuantity(item.id, parseInt(e.target.value, 10) || 1)
                                }
                                className="w-9 bg-transparent text-amber-300 font-mono font-bold text-center focus:outline-none"
                              />
                            ) : (
                              <strong className="text-amber-300 font-mono">
                                {toPersianDigits(item.quantity)}
                              </strong>
                            )}
                          </div>

                          {/* Indicators for note/photo */}
                          {item.notes && (
                            <span className="text-[10px] text-zinc-400 bg-[#1c1e27] px-1.5 py-0.5 rounded border border-[#2a2d3b] truncate max-w-[200px]">
                              «{item.notes}»
                            </span>
                          )}

                          {item.photoUrl && (
                            <span className="text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 flex items-center gap-1 font-mono">
                              <ImageIcon className="w-3 h-3" />
                              <span>تصویر پیوست</span>
                            </span>
                          )}
                        </div>

                        {/* Three-State Toggle Buttons */}
                        <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                          {/* 1. دارد (Present) */}
                          <button
                            type="button"
                            disabled={readOnly}
                            onClick={() => handleSetState(item.id, 'present')}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                              item.state === 'present'
                                ? 'bg-emerald-500 text-black shadow-sm'
                                : 'bg-[#1a1c24] text-zinc-400 hover:text-white border border-[#2b2e3c]'
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                item.state === 'present'
                                  ? 'border-black bg-black text-emerald-400'
                                  : 'border-zinc-500'
                              }`}
                            >
                              {item.state === 'present' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span>دارد</span>
                          </button>

                          {/* 2. ندارد (Missing) */}
                          <button
                            type="button"
                            disabled={readOnly}
                            onClick={() => handleSetState(item.id, 'missing')}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                              item.state === 'missing'
                                ? 'bg-rose-500 text-white shadow-sm'
                                : 'bg-[#1a1c24] text-zinc-400 hover:text-white border border-[#2b2e3c]'
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                item.state === 'missing'
                                  ? 'border-white bg-white text-rose-500'
                                  : 'border-zinc-500'
                              }`}
                            >
                              {item.state === 'missing' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                            </span>
                            <span>ندارد</span>
                          </button>

                          {/* 3. خراب (Damaged) */}
                          <button
                            type="button"
                            disabled={readOnly}
                            onClick={() => handleSetState(item.id, 'damaged')}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                              item.state === 'damaged'
                                ? 'bg-amber-500 text-black shadow-sm'
                                : 'bg-[#1a1c24] text-zinc-400 hover:text-white border border-[#2b2e3c]'
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                item.state === 'damaged'
                                  ? 'border-black bg-black text-amber-400'
                                  : 'border-zinc-500'
                              }`}
                            >
                              {item.state === 'damaged' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                            </span>
                            <span>خراب</span>
                          </button>

                          {/* Quick note toggle button */}
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() =>
                                setActiveNoteItemId(isNoteOpen ? null : item.id)
                              }
                              className={`p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors ${
                                item.notes ? 'text-amber-400' : ''
                              }`}
                              title="یادداشت / توضیح قلم"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick photo toggle button */}
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() =>
                                setActivePhotoItemId(isPhotoOpen ? null : item.id)
                              }
                              className={`p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors ${
                                item.photoUrl ? 'text-sky-400' : ''
                              }`}
                              title="پیوست عکس مدرک"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete custom item button */}
                          {!readOnly && item.id.startsWith('chk-custom') && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                              title="حذف قلم سفارشی"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Note Box */}
                      {isNoteOpen && !readOnly && (
                        <div className="pt-2">
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => handleSetNote(item.id, e.target.value)}
                            placeholder="توضیحات تکمیلی (مثلاً: ریموت اول سالم، ریموت دوم بدون باتری و خراب...)"
                            className="w-full bg-[#101115] border border-[#282a36] rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      )}

                      {/* Expandable Photo Uploader / Preview Box */}
                      {isPhotoOpen && !readOnly && (
                        <div className="pt-2 flex items-center gap-3 bg-[#111216] p-2.5 rounded-lg border border-[#272935]">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(item.id, e)}
                            className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:bg-[#1f212a] file:text-zinc-200 file:cursor-pointer"
                          />
                          {item.photoUrl && (
                            <div className="flex items-center gap-2">
                              <img
                                src={item.photoUrl}
                                alt="Checklist item"
                                className="w-10 h-10 rounded object-cover border border-amber-500/40"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = items.map((it) =>
                                    it.id === item.id
                                      ? { ...it, photoUrl: undefined, photoName: undefined }
                                      : it
                                  );
                                  onChangeItems(updated);
                                }}
                                className="text-xs text-rose-400 hover:text-rose-300"
                              >
                                حذف عکس
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Read-only photo preview */}
                      {readOnly && item.photoUrl && (
                        <div className="pt-1 flex items-center gap-2">
                          <img
                            src={item.photoUrl}
                            alt="Checklist item preview"
                            className="w-12 h-12 rounded-lg object-cover border border-[#2f3240]"
                          />
                          {item.notes && (
                            <span className="text-[11px] text-zinc-400">{item.notes}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Section 30: Checklist Completion Summary at Bottom */}
      <div className="p-3 bg-[#15161c] border border-[#272935] rounded-xl flex items-center justify-between text-xs">
        <span className="text-zinc-400">اقلام بررسی‌شده:</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold font-mono text-zinc-100 bg-[#20222a] px-3 py-1 rounded-lg border border-[#2e313c]">
            {toPersianDigits(inspectedCount)} / {toPersianDigits(totalCount)}
          </span>
          {inspectedCount === totalCount ? (
            <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>چک‌لیست کامل شد</span>
            </span>
          ) : (
            <span className="text-amber-400 text-[11px]">
              ({toPersianDigits(totalCount - inspectedCount)} قلم باقی‌مانده)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
