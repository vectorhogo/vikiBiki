import {
  Home,
  Receipt,
  Wallet,
  Car,
  BarChart3,
  Settings,
  TableProperties,
  Users,
  FileText,
  ScrollText,
  Landmark,
  Coins,
  WalletCards,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { toPersianDigits } from '../utils/formatters';

export type NavigationTab =
  | 'home'
  | 'contracts'
  | 'commissions'
  | 'accounts'
  | 'investors'
  | 'expenses'
  | 'advances'
  | 'vehicles'
  | 'customers'
  | 'sales'
  | 'reports'
  | 'settings'
  | 'catalog';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const {
    metrics,
    vehicles,
    customers,
    saleDossiers,
    contracts,
    dealCommissions,
    investorProfiles,
    liveFinancialAccounts,
  } = useAccounting();

  const primaryNavItems: {
    id: NavigationTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'home',
      label: 'خانه',
      icon: Home,
    },
    {
      id: 'contracts',
      label: 'قراردادها و مبایعه‌نامه‌ها',
      icon: ScrollText,
      badge: contracts.length > 0 ? toPersianDigits(contracts.length) : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'commissions',
      label: 'کمیسیون‌ها و کارمزد',
      icon: Coins,
      badge: dealCommissions.filter((c) => c.status !== 'settled').length > 0
        ? toPersianDigits(dealCommissions.filter((c) => c.status !== 'settled').length)
        : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'accounts',
      label: 'حساب‌های مالی و بانک‌ها',
      icon: Landmark,
      badge: liveFinancialAccounts.length > 0 ? toPersianDigits(liveFinancialAccounts.length) : undefined,
      badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    },
    {
      id: 'investors',
      label: 'کیف‌پول سرمایه‌گذاران',
      icon: WalletCards,
      badge: investorProfiles.length > 0 ? toPersianDigits(investorProfiles.length) : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'sales',
      label: 'پرونده‌های فروش و تحویل',
      icon: FileText,
      badge: saleDossiers.length > 0 ? toPersianDigits(saleDossiers.length) : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'customers',
      label: 'پرونده مشتریان',
      icon: Users,
      badge: customers.length > 0 ? toPersianDigits(customers.length) : undefined,
      badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    },
    {
      id: 'vehicles',
      label: 'خودروها',
      icon: Car,
      badge: vehicles.length > 0 ? toPersianDigits(vehicles.length) : undefined,
      badgeColor: 'bg-zinc-800 text-zinc-400 border border-zinc-700/40',
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
      id: 'reports',
      label: 'گزارش‌ها',
      icon: BarChart3,
    },
  ];

  return (
    <aside
      id="sidebar-navigation"
      className="w-56 glass-sidebar flex flex-col justify-between py-3 select-none shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.3)]"
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
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer text-right w-full ${
                isActive
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-en-num font-bold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Access to the Phase 01 inventory table sheet */}
        <div className="pt-3 mt-3 border-t border-white/10">
          <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            کاتالوگ و موجودی
          </div>
          <button
            id="nav-item-catalog"
            onClick={() => onSelectTab('catalog')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer text-right w-full ${
              activeTab === 'catalog'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <TableProperties className="w-4 h-4 text-zinc-400" />
            <span>برگه موجودی و قیمت</span>
          </button>
        </div>
      </div>

      {/* Secondary Navigation: Settings */}
      <div className="px-2.5 pt-2 border-t border-white/10">
        <button
          id="nav-item-settings"
          onClick={() => onSelectTab('settings')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer text-right w-full ${
            activeTab === 'settings'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          <Settings className="w-4 h-4 text-zinc-400" />
          <span>تنظیمات و پرسنل</span>
        </button>
      </div>
    </aside>
  );
};
