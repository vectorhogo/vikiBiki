import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, PenTool } from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  signerName: string;
  onSaveSignature: (dataUrl: string) => void;
  initialSignature?: string;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  title,
  signerName,
  onSaveSignature,
  initialSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<'#1e293b' | '#0369a1'>('#1e293b');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize for retina display
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);

        // Fill background white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);

        // Draw horizontal signature guide line
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(30, rect.height - 40);
        ctx.lineTo(rect.width - 30, rect.height - 40);
        ctx.stroke();

        // If there's an initial signature, render it
        if (initialSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
            setHasDrawn(true);
          };
          img.src = initialSignature;
        } else {
          setHasDrawn(false);
        }
      }, 50);
    }
  }, [isOpen, initialSignature]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Redraw guide line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, rect.height - 40);
    ctx.lineTo(rect.width - 30, rect.height - 40);
    ctx.stroke();

    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-[#17181d] border border-[#2c2f38] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-[#131417] border-b border-[#252830] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm text-zinc-100">{title}</span>
            {signerName && (
              <span className="text-xs text-zinc-400 font-normal">({signerName})</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-[#20222a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instructions & Pen Color */}
        <div className="px-4 py-2 bg-[#191a20] border-b border-[#242730] flex items-center justify-between text-xs text-zinc-400">
          <span>لطفاً با قلم لمسی یا ماوس در کادر سفید زیر امضا نمایید:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPenColor('#1e293b')}
              className={`w-5 h-5 rounded-full bg-slate-900 border ${penColor === '#1e293b' ? 'ring-2 ring-amber-400' : 'border-zinc-600'}`}
              title="جوهر مشکی"
            />
            <button
              type="button"
              onClick={() => setPenColor('#0369a1')}
              className={`w-5 h-5 rounded-full bg-sky-700 border ${penColor === '#0369a1' ? 'ring-2 ring-amber-400' : 'border-zinc-600'}`}
              title="جوهر آبی"
            />
          </div>
        </div>

        {/* Canvas Body */}
        <div className="p-4 bg-[#0e0f12] flex flex-col items-center justify-center">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-56 bg-white rounded-lg cursor-crosshair shadow-inner touch-none border border-zinc-300"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-[#131417] border-t border-[#252830] flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-[#1e2027] hover:bg-[#262933] border border-[#2d303a] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span>پاک کردن و امضای مجدد</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasDrawn}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>تأیید و درج امضا</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
