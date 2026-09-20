import React, { useState } from 'react';
import { X, Car } from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { InspectionStatus } from '../types/accounting';

interface NewVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewVehicleModal: React.FC<NewVehicleModalProps> = ({ isOpen, onClose }) => {
  const { addVehicle } = useAccounting();

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [vin, setVin] = useState('');
  const [color, setColor] = useState('');
  const [inspectionStatus, setInspectionStatus] = useState<InspectionStatus>('pending_inspection');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim() || !plate.trim()) return;

    addVehicle({
      brand: brand.trim() || 'سایر',
      model: model.trim(),
      fullName: `${brand.trim()} ${model.trim()}`,
      plate: plate.trim(),
      vin: vin.trim() || 'ثبت نشده',
      color: color.trim() || 'نامشخص',
      inspectionStatus,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-[#18191e] border border-[#2d3038] rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#26282e] flex items-center justify-between bg-[#141519]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100">ثبت خودرو جدید</h3>
              <p className="text-[11px] text-zinc-400">ورود اطلاعات خودرو جهت رهگیری هزینه‌ها و کارشناسی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#22242a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">برند سازنده</label>
              <input
                type="text"
                placeholder="مثال: تویوتا، چری، KMC"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">
                مدل و تیپ <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: کمری ۲۰۲۵ یا SR6"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">
                شماره پلاک <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: ۶۷الف۱۲۳ - ۲۱"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">رنگ بدنه</label>
              <input
                type="text"
                placeholder="مثال: سفید صدفی، مشکی"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1">شماره شاسی (VIN)</label>
            <input
              type="text"
              placeholder="مثال: KMHDU41DAEU123456"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-100 font-mono text-left focus:outline-none uppercase"
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1">وضعیت اولیه کارشناسی</label>
            <select
              value={inspectionStatus}
              onChange={(e) => setInspectionStatus(e.target.value as InspectionStatus)}
              className="w-full bg-[#131417] border border-[#2d3038] focus:border-amber-500 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none"
            >
              <option value="pending_inspection">در انتظار کارشناسی</option>
              <option value="not_inspected">کارشناسی نشده</option>
              <option value="inspected">کارشناسی انجام شد</option>
            </select>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#26282e] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-[#202228] transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={!model.trim() || !plate.trim()}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-zinc-950 font-bold rounded-lg transition-colors cursor-pointer"
            >
              ثبت خودرو
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
