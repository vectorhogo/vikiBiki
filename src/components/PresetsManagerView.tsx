import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { ReferencePreset, PresetCategory } from '../types/patch09c';
import { toPersianDigits } from '../utils/formatters';
import {
  Settings,
  Car,
  Palette,
  Fuel,
  Wrench,
  ShieldCheck,
  Receipt,
  FileText,
  Coins,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  X,
  Lock,
} from 'lucide-react';

export const PresetsManagerView: React.FC = () => {
  const { presets, addPreset, updatePreset, checkPermission, showToast } = useAccounting();

  const [activeCategory, setActiveCategory] = useState<PresetCategory>('vehicle_brands');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<ReferencePreset | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const canManage = checkPermission('manage_presets');

  const categoriesConfig: {
    id: PresetCategory;
    title: string;
    icon: React.FC<{ className?: string }>;
    description: string;
  }[] = [
    {
      id: 'vehicle_brands',
      title: 'برندهای خودرو',
      icon: Car,
      description: 'فهرست کارخانه‌ها و برندهای معتبر خودرویی (تویوتا، کی‌ام‌سی، هیوندای و...)',
    },
    {
      id: 'colors',
      title: 'رنگ‌های بدنه',
      icon: Palette,
      description: 'رنگ‌های فابریک و متداول خودروها (سفید صدفی، مشکی آبنوسی، تیتانیوم و...)',
    },
    {
      id: 'transmissions',
      title: 'گیربکس‌ها',
      icon: Wrench,
      description: 'انواع جعبه‌دنده (اتوماتیک تیپ‌ترونیک، دوکلاچه تر، CVT، E-CVT، دستی و...)',
    },
    {
      id: 'fuel_types',
      title: 'انواع سوخت',
      icon: Fuel,
      description: 'دسته‌بندی‌های پیشرانه و سوخت (بنزینی، هیبریدی HEV، پلاگین هیبرید، برقی و...)',
    },
    {
      id: 'insurance_companies',
      title: 'شرکت‌های بیمه',
      icon: ShieldCheck,
      description: 'شرکت‌های بیمه‌گر مجاز صادرکننده بیمه‌نامه شخص ثالث و بدنه در ایران',
    },
    {
      id: 'document_types',
      title: 'انواع اسناد و مدارک',
      icon: FileText,
      description: 'عناوین اسناد قانونی (برگ سبز، وکالت تعویض پلاک، وکالت فروش، معاینه فنی و...)',
    },
    {
      id: 'expense_categories',
      title: 'دسته‌بندی‌های هزینه',
      icon: Receipt,
      description: 'سرفصل‌های هزینه‌کرد نمایشگاه (کارشناسی، سوخت، دیتیلینگ، تعمیرگاه و...)',
    },
    {
      id: 'commission_categories',
      title: 'دسته‌بندی‌های کمیسیون',
      icon: Coins,
      description: 'انواع توافقات کارمزد و حق‌العمل معاملات خودرو',
    },
  ];

  // Current category presets filtered by search
  const currentPresets = useMemo(() => {
    return presets
      .filter((p) => p.category === activeCategory)
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
      })
      .sort((a, b) => a.order - b.order);
  }, [presets, activeCategory, searchQuery]);

  const handleOpenAdd = () => {
    setEditingPreset(null);
    setName('');
    setCode('');
    setDescription('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: ReferencePreset) => {
    setEditingPreset(p);
    setName(p.name);
    setCode(p.code);
    setDescription(p.description || '');
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingPreset) {
      updatePreset(editingPreset.id, {
        name: name.trim(),
        code: code.trim() || editingPreset.code,
        description: description.trim() || undefined,
      });
      setIsAddModalOpen(false);
    } else {
      const result = addPreset({
        category: activeCategory,
        name: name.trim(),
        code: code.trim() || `custom_${Date.now()}`,
        description: description.trim() || undefined,
        isActive: true,
        order: currentPresets.length + 1,
      });
      if (result.success) {
        setIsAddModalOpen(false);
      }
    }
  };

  const togglePresetActive = (p: ReferencePreset) => {
    if (!canManage) {
      showToast('شما دسترسی لازم برای ویرایش فهرست‌های مرجع را ندارید.', 'error');
      return;
    }
    updatePreset(p.id, { isActive: !p.isActive });
  };

  const activeCategoryMeta = categoriesConfig.find((c) => c.id === activeCategory);

  return (
    <div className="space-y-5 animate-in fade-in duration-200" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-zinc-100">فهرست‌های مرجع و پیش‌تنظیم‌ها (Presets)</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            مدیریت مقادیر مرجع استاندارد برای ثبت سریع، اعتبارسنجی یکپارچه و پیشگیری از داده‌های تکراری
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="btn-minimal-amber inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>افزودن مقدار جدید به این دسته</span>
          </button>
        )}
      </div>

      {/* Categories Horizontal Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800/80">
        {categoriesConfig.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const count = presets.filter((p) => p.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                  : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
              <span>{cat.title}</span>
              <span className="font-en-num text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400">
                {toPersianDigits(count)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Info & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
        <div className="flex items-center gap-2 text-zinc-300">
          <span className="font-bold text-amber-400">{activeCategoryMeta?.title}:</span>
          <span className="text-zinc-400 text-[11px]">{activeCategoryMeta?.description}</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-64 bg-zinc-800/70 border border-zinc-700/60 rounded-lg px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="جستجو در این فهرست..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-zinc-100 text-xs focus:outline-none placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Presets Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="py-2.5 px-4 font-semibold">ردیف</th>
              <th className="py-2.5 px-4 font-semibold">عنوان نمایشی فارسی</th>
              <th className="py-2.5 px-4 font-semibold">کد سیستمی</th>
              <th className="py-2.5 px-4 font-semibold">توضیحات</th>
              <th className="py-2.5 px-4 font-semibold text-center">وضعیت</th>
              <th className="py-2.5 px-4 font-semibold text-left">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {currentPresets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                  هیچ موردی در این دسته‌بندی یافت نشد.
                </td>
              </tr>
            ) : (
              currentPresets.map((item, idx) => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-en-num text-zinc-500 text-center w-12">
                    {toPersianDigits(idx + 1)}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-zinc-100">{item.name}</td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-zinc-400">{item.code}</td>
                  <td className="py-2.5 px-4 text-zinc-400 text-[11px]">{item.description || '—'}</td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => togglePresetActive(item)}
                      disabled={!canManage}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                        item.isActive
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-400'
                      } ${!canManage ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                    >
                      {item.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>فعال</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-zinc-500" />
                          <span>غیرفعال</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-2.5 px-4 text-left">
                    {canManage ? (
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="btn-minimal px-2 py-1 rounded-lg text-[11px] text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>ویرایش</span>
                      </button>
                    ) : (
                      <span className="text-zinc-600 text-[10px] flex items-center gap-1 justify-end">
                        <Lock className="w-3 h-3" />
                        <span>فقط خواندنی</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-[#18191e] border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
              <h3 className="font-bold text-zinc-100 text-sm">
                {editingPreset ? 'ویرایش مقدار مرجع' : `افزودن به ${activeCategoryMeta?.title}`}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  عنوان نمایشی فارسی <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تویوتا کمری یا سفید صدفی"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">کد سیستمی (انگلیسی / اختیاری):</label>
                <input
                  type="text"
                  placeholder="مثال: toyota_camry یا pearl_white"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">توضیحات تکمیلی (اختیاری):</label>
                <textarea
                  rows={2}
                  placeholder="مشخصات استاندارد یا راهنمای استفاده..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-minimal px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="btn-minimal-amber px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {editingPreset ? 'ذخیره تغییرات' : 'ثبت مقدار'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
