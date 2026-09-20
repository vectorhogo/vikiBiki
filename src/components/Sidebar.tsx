import React from 'react';
import { Home, Receipt, Wallet, Car, BarChart3, Settings, TableProperties } from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { toPersianDigits } from '../utils/formatters';

export type NavigationTab = 'home' | 'expenses' | 'advances' | 'vehicles' | 'reports' | 'settings' | 'catalog';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { metrics, vehicles } = useAccounting();

  const primaryNavItems: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }>; badge?: number | string; badgeColor?: string }[] = [
    {
      id: 'home',
      label: 'خانه',
      icon: Home,
    },
    {
      id: 'expenses',
      label: 'هزینه‌ها',
      icon: Receipt,
      badge: metrics.missingReceiptCount > 0 ? toPersianDigits(metrics.missingReceiptCount) : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'advances',
      label: 'تنخواه',
      icon: Wallet,
      badge: metrics.pendingSettlementCount > 0 ? toPersianDigits(metrics.pendingSettlementCount) : undefined,
      badgeColor: 'bg-zinc-700/60 text-zinc-300 border border-zinc-600/40',
    },
    {
      id: 'vehicles',
      label: 'خودروها',
      icon: Car,
      badge: vehicles.length > 0 ? toPersianDigits(vehicles.length) : undefined,
      badgeColor: 'bg-zinc-800 text-zinc-400 border border-zinc-700/40',
    },
    {
      id: 'reports',
      label: 'گزارش‌ها',
      icon: BarChart3,
    },
  ];

  return (
    <aside
      id="sidebar-navigation"
      className="w-56 bg-[#141518] border-l border-[#26282e] flex flex-col justify-between py-3 select-none shrink-0"
      dir="rtl"
    >
      <div className="flex flex-col gap-1 px-2.5">
        <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
          بخش‌های اصلی
        </div>

        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer text-right w-full ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1c22] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Access to the Phase 01 inventory table sheet */}
        <div className="pt-3 mt-3 border-t border-[#23252b]">
          <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            کاتالوگ و موجودی
          </div>
          <button
            id="nav-item-catalog"
            onClick={() => onSelectTab('catalog')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer text-right w-full ${
              activeTab === 'catalog'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1c22] border border-transparent'
            }`}
          >
            <TableProperties className="w-4 h-4 text-zinc-400" />
            <span>برگه موجودی و قیمت</span>
          </button>
        </div>
      </div>

      {/* Secondary Navigation: Settings */}
      <div className="px-2.5 pt-2 border-t border-[#23252b]">
        <button
          id="nav-item-settings"
          onClick={() => onSelectTab('settings')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer text-right w-full ${
            activeTab === 'settings'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1c22] border border-transparent'
          }`}
        >
          <Settings className="w-4 h-4 text-zinc-400" />
          <span>تنظیمات و پرسنل</span>
        </button>
      </div>
    </aside>
  );
};
