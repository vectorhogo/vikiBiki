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
import { OpeningDocumentModal } from './components/OpeningDocumentModal';
import { OpeningDocumentsListModal } from './components/OpeningDocumentsListModal';
import { PeriodBanner } from './components/PeriodBanner';
import { PeriodIntegrityModal } from './components/PeriodIntegrityModal';
import { PeriodManagementModal } from './components/PeriodManagementModal';
import { CustomersView } from './components/CustomersView';
import { SalesArchiveView } from './components/SalesArchiveView';
import { ContractsView } from './components/ContractsView';
import { FinancialAccountsView } from './components/FinancialAccountsView';
import { CommissionsView } from './components/CommissionsView';
import { InvestorWalletView } from './components/InvestorWalletView';
import { CustomerDetailDrawer } from './components/CustomerDetailDrawer';
import { SaleDossierDrawer } from './components/SaleDossierDrawer';
import { NewSaleDossierModal } from './components/NewSaleDossierModal';
import { NewCustomerModal } from './components/NewCustomerModal';
import { Customer } from './types/customerSales';
import { ReportType } from './components/ReportsView';
import { Archive } from 'lucide-react';

function MainAppContent() {
  const {
    isUnlocked,
    isConfigured,
    unlockWithTotp,
    setupTotp,
    lockoutRemainingSec,
    currentTotpSecret,
    isViewingHistoricalPeriod,
    viewingPeriod,
    activePeriod,
    activePeriodId,
    setViewingPeriodId,
    customers,
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
  const [isOpeningDocModalOpen, setIsOpeningDocModalOpen] = useState(false);
  const [isOpeningDocsListOpen, setIsOpeningDocsListOpen] = useState(false);
  const [isPeriodIntegrityOpen, setIsPeriodIntegrityOpen] = useState(false);
  const [isPeriodManagementOpen, setIsPeriodManagementOpen] = useState(false);
  const [periodManagementMode, setPeriodManagementMode] = useState<'close' | 'reopen'>('close');

  // Phase 07: Customer & Sale Dossier states
  const [selectedCustomerIdForDrawer, setSelectedCustomerIdForDrawer] = useState<string | null>(null);
  const [selectedSaleIdForDrawer, setSelectedSaleIdForDrawer] = useState<string | null>(null);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [preSelectedCustIdForSale, setPreSelectedCustIdForSale] = useState<string | undefined>();
  const [preSelectedVehIdForSale, setPreSelectedVehIdForSale] = useState<string | undefined>();
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [editingCustomerForModal, setEditingCustomerForModal] = useState<Customer | null>(null);

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
        setSelectedCustomerIdForDrawer(null);
        setSelectedSaleIdForDrawer(null);
        setIsNewSaleModalOpen(false);
        setIsNewCustomerModalOpen(false);
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
    <div className="min-h-screen bg-[#0c0d12] text-zinc-100 flex flex-col font-['Yekan',sans-serif] selection:bg-amber-500/30 selection:text-amber-200 relative overflow-hidden" dir="rtl">
      {/* Ambient background glows for glassmorphism */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-amber-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-32 w-[600px] h-[600px] bg-sky-500/[0.03] rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 right-1/3 w-[550px] h-[550px] bg-indigo-500/[0.03] rounded-full blur-[130px]" />
      </div>

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
        onOpenNewOpeningDoc={() => setIsOpeningDocModalOpen(true)}
        onOpenOpeningDocsList={() => setIsOpeningDocsListOpen(true)}
        onOpenIntegrityModal={() => setIsPeriodIntegrityOpen(true)}
        onOpenPeriodManagementModal={(mode) => {
          setPeriodManagementMode(mode);
          setIsPeriodManagementOpen(true);
        }}
      />

      {/* Financial Period Status & Read-Only Warning Banner */}
      <PeriodBanner
        onOpenReopenModal={() => {
          setPeriodManagementMode('reopen');
          setIsPeriodManagementOpen(true);
        }}
        onOpenIntegrityModal={() => setIsPeriodIntegrityOpen(true)}
      />

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Right Sidebar (in RTL) */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Center/Left Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-[#0f1015]/60 backdrop-blur-md">
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

          {activeTab === 'contracts' && (
            <ContractsView
              onOpenCustomerProfile={(cId) => setSelectedCustomerIdForDrawer(cId)}
              onOpenVehicleExpenses={handleOpenExpenseForVehicle}
            />
          )}

          {activeTab === 'commissions' && <CommissionsView />}

          {activeTab === 'accounts' && <FinancialAccountsView />}

          {activeTab === 'investors' && <InvestorWalletView />}

          {activeTab === 'sales' && (
            <SalesArchiveView
              onOpenCustomerProfile={(cId) => setSelectedCustomerIdForDrawer(cId)}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              onOpenSaleDossier={(sId) => setSelectedSaleIdForDrawer(sId)}
              onCreateSaleForCustomer={(cId) => {
                setPreSelectedCustIdForSale(cId);
                setPreSelectedVehIdForSale(undefined);
                setIsNewSaleModalOpen(true);
              }}
            />
          )}

          {activeTab === 'vehicles' && (
            <VehiclesView
              onOpenQuickExpenseForVehicle={handleOpenExpenseForVehicle}
              onOpenSaleDossier={(sId) => setSelectedSaleIdForDrawer(sId)}
              onCreateSaleForVehicle={(vId) => {
                setPreSelectedVehIdForSale(vId);
                setPreSelectedCustIdForSale(undefined);
                setIsNewSaleModalOpen(true);
              }}
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
        onOpenCustomer={(cId) => setSelectedCustomerIdForDrawer(cId)}
        onOpenSaleDossier={(sId) => setSelectedSaleIdForDrawer(sId)}
      />

      <ActivationModal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
      />

      <OpeningDocumentModal
        isOpen={isOpeningDocModalOpen}
        onClose={() => setIsOpeningDocModalOpen(false)}
      />

      <OpeningDocumentsListModal
        isOpen={isOpeningDocsListOpen}
        onClose={() => setIsOpeningDocsListOpen(false)}
        onOpenNewModal={() => setIsOpeningDocModalOpen(true)}
      />

      <PeriodIntegrityModal
        isOpen={isPeriodIntegrityOpen}
        onClose={() => setIsPeriodIntegrityOpen(false)}
      />

      <PeriodManagementModal
        isOpen={isPeriodManagementOpen}
        onClose={() => setIsPeriodManagementOpen(false)}
        mode={periodManagementMode}
      />

      {/* Phase 07: Customer Profile & Sale Dossier Drawers & Modals */}
      {selectedCustomerIdForDrawer && (
        <CustomerDetailDrawer
          customer={customers.find((c) => c.id === selectedCustomerIdForDrawer) || null}
          onClose={() => setSelectedCustomerIdForDrawer(null)}
          onEditCustomer={(cust) => {
            setEditingCustomerForModal(cust);
            setIsNewCustomerModalOpen(true);
          }}
          onCreateSaleForCustomer={(cId) => {
            setPreSelectedCustIdForSale(cId);
            setPreSelectedVehIdForSale(undefined);
            setIsNewSaleModalOpen(true);
          }}
          onOpenSaleDossier={(sId) => setSelectedSaleIdForDrawer(sId)}
        />
      )}

      {selectedSaleIdForDrawer && (
        <SaleDossierDrawer
          saleId={selectedSaleIdForDrawer}
          onClose={() => setSelectedSaleIdForDrawer(null)}
          onOpenCustomerProfile={(cId) => setSelectedCustomerIdForDrawer(cId)}
        />
      )}

      <NewSaleDossierModal
        isOpen={isNewSaleModalOpen}
        onClose={() => {
          setIsNewSaleModalOpen(false);
          setPreSelectedCustIdForSale(undefined);
          setPreSelectedVehIdForSale(undefined);
        }}
        preSelectedCustomerId={preSelectedCustIdForSale}
        preSelectedVehicleId={preSelectedVehIdForSale}
        onSaleCreated={(newSale) => {
          setSelectedSaleIdForDrawer(newSale.id);
        }}
      />

      <NewCustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => {
          setIsNewCustomerModalOpen(false);
          setEditingCustomerForModal(null);
        }}
        initialCustomer={editingCustomerForModal}
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
