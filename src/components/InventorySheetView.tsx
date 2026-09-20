import React, { useState, useRef } from 'react';
import { INITIAL_CARS, CarItem } from '../data/cars';
import { AutoAbdollahiSheet } from './AutoAbdollahiSheet';
import { Download, CheckCircle2, RefreshCw, Sliders, Eye } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

export const InventorySheetView: React.FC = () => {
  const [cars, setCars] = useState<CarItem[]>(INITIAL_CARS);
  const [showLayoutGuide, setShowLayoutGuide] = useState<boolean>(false);
  const [carImageWidth, setCarImageWidth] = useState<number>(82);
  const [carImageHeight, setCarImageHeight] = useState<number>(56);
  const [imageOffset, setImageOffset] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);

  const handleExportPNG = async () => {
    if (!sheetRef.current) return;
    try {
      setIsExporting(true);
      setExportSuccess(null);

      const dataUrl = await htmlToImage.toPng(sheetRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `Auto-Abdollahi-Inventory-Page3-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      setExportSuccess('فایل تصویر با کیفیت بالا دانلود شد');
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto" dir="rtl">
      {/* Control Bar */}
      <div className="bg-[#17181d] border border-[#26282e] p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <h2 className="text-sm font-bold text-zinc-100">برگه رسمی موجودی و قیمت اتو عبداللهی (صفحه ۳)</h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            چیدمان دقیق راست‌به‌چپ: [لوگو برند] ← [نام فارسی خودرو] ← [تصویر ۳/۴ خودرو]
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLayoutGuide(!showLayoutGuide)}
            className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
              showLayoutGuide
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-[#1e2027] text-zinc-300 border-[#2d3039] hover:bg-[#252831]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showLayoutGuide ? 'مخفی‌سازی راهنمای ستون‌ها' : 'نمایش راهنمای ستون‌ها'}</span>
          </button>

          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'در حال تولید تصویر...' : 'خروجی تصویر (PNG)'}</span>
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* The Inventory Table */}
      <div className="overflow-x-auto bg-[#141518] p-4 rounded-xl border border-[#26282e] shadow-lg">
        <div ref={sheetRef} className="min-w-[950px] inline-block bg-white text-zinc-900 rounded-lg overflow-hidden">
          <AutoAbdollahiSheet
            cars={cars}
            showLayoutGuide={showLayoutGuide}
            carImageWidth={carImageWidth}
            carImageHeight={carImageHeight}
            imageOffset={imageOffset}
          />
        </div>
      </div>
    </div>
  );
};
