import React, { useState, useRef } from 'react';
import { INITIAL_CARS, CarItem } from '../data/cars';
import { AutoAbdollahiSheet } from './AutoAbdollahiSheet';
import {
  Download,
  CheckCircle2,
  Eye,
  Copy,
  Sparkles,
  Layers,
  FileImage,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import html2canvas from 'html2canvas';

export const InventorySheetView: React.FC = () => {
  const [cars] = useState<CarItem[]>(INITIAL_CARS);
  const [showLayoutGuide, setShowLayoutGuide] = useState<boolean>(false);
  const [carImageWidth] = useState<number>(82);
  const [carImageHeight] = useState<number>(56);
  const [imageOffset] = useState<number>(0);

  // Export resolution options: 2x (High-Res 150-200 DPI) or 3x (Ultra-HD 300 DPI)
  const [exportScale, setExportScale] = useState<number>(2);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatusText, setExportStatusText] = useState<string>('');
  const [exportSuccess, setExportSuccess] = useState<{
    message: string;
    dimensions?: string;
    downloadName?: string;
  } | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);

  /**
   * Generates high-resolution canvas using html2canvas with strict RTL styling preservation
   * and vector brand badge fidelity.
   */
  const renderTableCanvas = async (scale: number): Promise<HTMLCanvasElement | null> => {
    if (!sheetRef.current) return null;

    // Ensure all webfonts (especially Yekan) are fully loaded
    if (document.fonts && document.fonts.ready) {
      setExportStatusText('در حال آماده‌سازی فونت یکان و المان‌های وکتور...');
      await document.fonts.ready;
    }

    setExportStatusText(`در حال پردازش رندر با دقت ${scale}X (html2canvas)...`);

    const targetElement = sheetRef.current;

    // Capture element using html2canvas with exact RTL and SVG preservation options
    const canvas = await html2canvas(targetElement, {
      scale, // 2x or 3x high-resolution multiplier
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: targetElement.scrollWidth + 100,
      windowHeight: targetElement.scrollHeight + 100,
      onclone: (clonedDoc, clonedElement) => {
        // 1. Force RTL direction and Yekan font throughout the cloned tree
        clonedDoc.documentElement.setAttribute('dir', 'rtl');
        clonedDoc.documentElement.setAttribute('lang', 'fa');
        clonedDoc.body.style.direction = 'rtl';
        clonedDoc.body.style.fontFamily = "'Yekan', sans-serif";

        // 2. Ensure cloned element is clean, unclipped, and properly aligned
        clonedElement.style.direction = 'rtl';
        clonedElement.style.fontFamily = "'Yekan', sans-serif";
        clonedElement.style.transform = 'none';
        clonedElement.style.margin = '0 auto';
        clonedElement.style.overflow = 'visible';

        // 3. Make sure all SVG brand badges and car graphics preserve bounding box dimensions
        const svgs = clonedElement.querySelectorAll('svg');
        svgs.forEach((svg) => {
          svg.style.overflow = 'visible';
          const rect = svg.getBoundingClientRect();
          if (rect.width > 0 && !svg.getAttribute('width')) {
            svg.setAttribute('width', `${Math.round(rect.width)}`);
          }
          if (rect.height > 0 && !svg.getAttribute('height')) {
            svg.setAttribute('height', `${Math.round(rect.height)}`);
          }
        });

        // 4. Ensure table cells maintain alignment and borders
        const cells = clonedElement.querySelectorAll('td, th');
        cells.forEach((cell) => {
          const el = cell as HTMLElement;
          el.style.fontFamily = "'Yekan', sans-serif";
        });

        // 5. Ensure all numeric cells with .font-en-num strictly preserve English numerals and LTR orientation
        const numCells = clonedElement.querySelectorAll('.font-en-num');
        numCells.forEach((num) => {
          const el = num as HTMLElement;
          el.style.direction = 'ltr';
          el.style.unicodeBidi = 'isolate';
          el.style.display = 'inline-block';
          el.style.fontFamily = "'Yekan', sans-serif";
        });
      },
    });

    return canvas;
  };

  /**
   * Primary PNG download handler
   */
  const handleExportPNG = async () => {
    if (!sheetRef.current || isExporting) return;
    try {
      setIsExporting(true);
      setExportSuccess(null);

      const canvas = await renderTableCanvas(exportScale);
      if (!canvas) {
        throw new Error('عدم دسترسی به جدول جهت تصویربرداری');
      }

      setExportStatusText('در حال کدگذاری فایل با کیفیت PNG...');

      const filename = `Auto-Abdollahi-Inventory-Page3-1405-06-29-${exportScale}X.png`;
      const dataUrl = canvas.toDataURL('image/png', 1.0);

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess({
        message: 'فایل تصویر با وضوح بالا (PNG) با موفقیت دانلود شد.',
        dimensions: `${canvas.width} × ${canvas.height} پیکسل`,
        downloadName: filename,
      });
      setTimeout(() => setExportSuccess(null), 6000);
    } catch (err: any) {
      console.error('html2canvas export error:', err);
      alert('خطا در ایجاد خروجی تصویر: ' + (err?.message || 'لطفاً دوباره تلاش فرمایید.'));
    } finally {
      setIsExporting(false);
      setExportStatusText('');
    }
  };

  /**
   * Direct Copy-to-Clipboard handler for instant sharing in Telegram/WhatsApp/Word
   */
  const handleCopyToClipboard = async () => {
    if (!sheetRef.current || isExporting) return;
    try {
      setIsExporting(true);
      setExportSuccess(null);

      const canvas = await renderTableCanvas(2); // 2X is ideal for clipboard
      if (!canvas) return;

      setExportStatusText('در حال آماده‌سازی تصویر برای کلیپ‌بورد...');

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          if (navigator.clipboard && navigator.clipboard.write) {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            setExportSuccess({
              message: 'تصویر جدول مستقیماً در کلیپ‌بورد کپی شد (آماده Paste در چت یا سند).',
              dimensions: `${canvas.width} × ${canvas.height} px`,
            });
            setTimeout(() => setExportSuccess(null), 5000);
          } else {
            // Fallback: download if clipboard item API not permitted
            handleExportPNG();
          }
        } catch {
          // If browser restricts clipboard image write, fallback to direct download
          handleExportPNG();
        } finally {
          setIsExporting(false);
          setExportStatusText('');
        }
      }, 'image/png');
    } catch (err) {
      console.error('Clipboard copy error:', err);
      setIsExporting(false);
      setExportStatusText('');
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto font-['Yekan',sans-serif]" dir="rtl">
      {/* Glassmorphic Control Bar with Minimal Buttons */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm sm:text-base font-bold text-zinc-100">
              برگه رسمی موجودی و قیمت اتو عبداللهی (صفحه 3)
            </h2>
            <span className="font-en-num px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-bold text-[11px] border border-amber-500/30">
              1405/06/29
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
            <span>فونت استاندارد یکان (Yekan)</span>
            <span>•</span>
            <span>اعداد انگلیسی با کلاس <code className="font-mono text-amber-300 text-[10px] bg-white/[0.05] px-1 py-0.2 rounded">font-en-num</code></span>
            <span>•</span>
            <span>خروجی وکتور با html2canvas</span>
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Minimal Resolution Segmented Toggle */}
          <div className="inline-flex items-center bg-white/[0.03] border border-white/10 rounded-xl p-1 text-xs backdrop-blur-md">
            <button
              onClick={() => setExportScale(2)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1 ${
                exportScale === 2
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
              title="وضوح بالا استاندارد (۲ برابر)"
            >
              <span>2X HD</span>
            </button>
            <button
              onClick={() => setExportScale(3)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1 ${
                exportScale === 3
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
              title="وضوح فوق‌العاده چاپی ۳۰۰ DPI (۳ برابر)"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>3X Ultra</span>
            </button>
          </div>

          {/* Minimal Guide Toggle Button */}
          <button
            onClick={() => setShowLayoutGuide(!showLayoutGuide)}
            className={`btn-minimal px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 ${
              showLayoutGuide
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : ''
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showLayoutGuide ? 'مخفی‌سازی راهنما' : 'راهنمای ستون‌ها'}</span>
          </button>

          {/* Minimal Copy to Clipboard Button */}
          <button
            onClick={handleCopyToClipboard}
            disabled={isExporting}
            className="btn-minimal px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="کپی تصویر در حافظه موقت (کلیپ‌بورد)"
          >
            <Copy className="w-3.5 h-3.5 text-zinc-400" />
            <span>کپی تصویر</span>
          </button>

          {/* Primary High-Resolution PNG Export Button (Minimal Amber) */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="btn-minimal-amber px-4 py-1.5 rounded-xl cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                <span>{exportStatusText || 'در حال رندر تصویر...'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>خروجی PNG ({exportScale}X)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {exportSuccess && (
        <div className="p-3.5 rounded-2xl glass-panel border border-emerald-500/40 text-emerald-100 text-xs flex items-center justify-between gap-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold block text-sm">{exportSuccess.message}</span>
              {exportSuccess.dimensions && (
                <span className="text-emerald-300/80 text-[11px] font-mono mt-0.5 block">
                  ابعاد تصویر: <span className="font-en-num">{exportSuccess.dimensions}</span> • فرمت: PNG 24-bit با پشتیبانی از فونت یکان و وکتورهای لوگو
                </span>
              )}
            </div>
          </div>
          {exportSuccess.downloadName && (
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-emerald-900/60 font-mono text-[10px] text-emerald-200 border border-emerald-700/50">
              {exportSuccess.downloadName}
            </span>
          )}
        </div>
      )}

      {/* The Printable / Renderable Inventory Table Container with Glassmorphism */}
      <div className="overflow-x-auto glass-panel p-4 sm:p-6 rounded-2xl shadow-2xl">
        <div
          ref={sheetRef}
          className="min-w-[960px] inline-block bg-white text-zinc-900 rounded-2xl overflow-hidden shadow-sm font-['Yekan',sans-serif]"
          style={{ fontFamily: "'Yekan', sans-serif" }}
        >
          <AutoAbdollahiSheet
            cars={cars}
            showLayoutGuide={showLayoutGuide}
            carImageWidth={carImageWidth}
            carImageHeight={carImageHeight}
            imageOffset={imageOffset}
          />
        </div>
      </div>

      {/* Minimal Bottom Info Strip */}
      <div className="glass-panel-subtle p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span>جدول فعال و آماده برای استخراج با دقت پیکسل بالا</span>
        </div>
        <div className="flex items-center gap-3">
          <span>تعداد خودروها: <strong className="font-en-num text-zinc-200 font-bold">{cars.length}</strong></span>
          <span>•</span>
          <span>موتور خروجی: <strong className="text-zinc-200">html2canvas Engine</strong></span>
          <span>•</span>
          <span>فونت فعال: <strong className="text-amber-400">Yekan Webfont</strong></span>
        </div>
      </div>
    </div>
  );
};
