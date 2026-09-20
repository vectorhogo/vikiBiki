import React, { useState, useEffect } from 'react';
import { AccountingProvider, useAccounting } from './context/AccountingContext';
import { Topbar } from './components/Topbar';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ExpensesView } from './components/ExpensesView';
import { CashAdvanceView } from './components/CashAdvanceView';
import { VehiclesView } from './components/VehiclesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { InventorySheetView } from './components/InventorySheetView';
import { QuickExpenseModal } from './components/QuickExpenseModal';
import { NewCashAdvanceModal } from './components/NewCashAdvanceModal';
import { NewVehicleModal } from './components/NewVehicleModal';
import { UniversalSearchModal } from './components/UniversalSearchModal';
import { ActivationModal } from './components/ActivationModal';
import { LockScreen } from './components/LockScreen';
import { TotpSetupModal } from './components/TotpSetupModal';
import { ToastContainer } from './components/ToastContainer';
import { ReportType } from './components/ReportsView';

function MainAppContent() {
  const {
    isUnlocked,
    isConfigured,
    unlockWithTotp,
    setupTotp,
    lockoutRemainingSec,
    currentTotpSecret,
  } = useAccounting();

  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [activeReportSubTab, setActiveReportSubTab] = useState<ReportType>('expenses');

  // Modal visibility states
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);
  const [isCashAdvanceOpen, setIsCashAdvanceOpen] = useState(false);
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  // Contextual pre-fill params for Quick Expense
  const [contextualVehicleId, setContextualVehicleId] = useState<string | undefined>();
  const [contextualPersonId, setContextualPersonId] = useState<string | undefined>();
  const [contextualAdvanceId, setContextualAdvanceId] = useState<string | undefined>();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N -> New Expense
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setContextualVehicleId(undefined);
        setContextualPersonId(undefined);
        setContextualAdvanceId(undefined);
        setIsQuickExpenseOpen(true);
      }
      // Ctrl+F or Cmd+F -> Universal Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Escape -> Close any open modal
      if (e.key === 'Escape') {
        setIsQuickExpenseOpen(false);
        setIsCashAdvanceOpen(false);
        setIsNewVehicleOpen(false);
        setIsSearchOpen(false);
        setIsActivationModalOpen(false);
        setIsSetupModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenExpenseForVehicle = (vehicleId: string) => {
    setContextualVehicleId(vehicleId);
    setContextualPersonId(undefined);
    setContextualAdvanceId(undefined);
    setIsQuickExpenseOpen(true);
  };

  const handleOpenExpenseForPerson = (personId: string, cashAdvanceId?: string) => {
    setContextualPersonId(personId);
    setContextualAdvanceId(cashAdvanceId);
    setContextualVehicleId(undefined);
    setIsQuickExpenseOpen(true);
  };

  // If application is locked (expired lease or manual lock)
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#0f1013] text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200" dir="rtl">
        <LockScreen
          onUnlock={unlockWithTotp}
          isConfigured={isConfigured}
          onOpenSetup={() => setIsSetupModalOpen(true)}
          lockoutRemainingSec={lockoutRemainingSec}
        />

        <TotpSetupModal
          isOpen={isSetupModalOpen}
          onClose={() => setIsSetupModalOpen(false)}
          currentSecret={currentTotpSecret}
          onSetupSuccess={async (newSecret) => {
            await setupTotp(newSecret);
            setIsSetupModalOpen(false);
          }}
        />

        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1013] text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200" dir="rtl">
      {/* Top Header */}
      <Topbar
        onOpenQuickExpense={() => {
          setContextualVehicleId(undefined);
          setContextualPersonId(undefined);
          setContextualAdvanceId(undefined);
          setIsQuickExpenseOpen(true);
        }}
        onOpenCashAdvance={() => setIsCashAdvanceOpen(true)}
        onOpenNewVehicle={() => setIsNewVehicleOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenActivationModal={() => setIsActivationModalOpen(true)}
      />

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Right Sidebar (in RTL) */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Center/Left Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-[#111216]">
          {activeTab === 'home' && (
            <DashboardView
              onNavigate={(tab, subTab) => {
                setActiveTab(tab);
                if (subTab) {
                  setActiveReportSubTab(subTab as ReportType);
                }
              }}
              onOpenQuickExpense={() => {
                setContextualVehicleId(undefined);
                setContextualPersonId(undefined);
                setContextualAdvanceId(undefined);
                setIsQuickExpenseOpen(true);
              }}
              onOpenCashAdvance={() => setIsCashAdvanceOpen(true)}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              onOpenQuickExpense={() => {
                setContextualVehicleId(undefined);
                setContextualPersonId(undefined);
                setContextualAdvanceId(undefined);
                setIsQuickExpenseOpen(true);
              }}
            />
          )}

          {activeTab === 'advances' && (
            <CashAdvanceView
              onOpenQuickExpenseWithPerson={handleOpenExpenseForPerson}
            />
          )}

          {activeTab === 'vehicles' && (
            <VehiclesView
              onOpenQuickExpenseForVehicle={handleOpenExpenseForVehicle}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView key={activeReportSubTab} initialReportType={activeReportSubTab} />
          )}

          {activeTab === 'settings' && <SettingsView />}

          {activeTab === 'catalog' && <InventorySheetView />}
        </main>
      </div>

      {/* Global Modals */}
      <QuickExpenseModal
        isOpen={isQuickExpenseOpen}
        onClose={() => setIsQuickExpenseOpen(false)}
        initialVehicleId={contextualVehicleId}
        initialPersonId={contextualPersonId}
        initialCashAdvanceId={contextualAdvanceId}
      />

      <NewCashAdvanceModal
        isOpen={isCashAdvanceOpen}
        onClose={() => setIsCashAdvanceOpen(false)}
      />

      <NewVehicleModal
        isOpen={isNewVehicleOpen}
        onClose={() => setIsNewVehicleOpen(false)}
      />

      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setActiveTab}
      />

      <ActivationModal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
      />

      {/* Notifications Toast */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AccountingProvider>
      <MainAppContent />
    </AccountingProvider>
  );
}
