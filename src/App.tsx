import React, { useState, useEffect } from 'react';
import { User } from './types';
import { StorageService } from './services/storage';

// Brand & Common Components
import { Header } from './components/common/Header';
import { MobileNav } from './components/common/MobileNav';
import { SplashScreen } from './components/common/SplashScreen';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { PWAInstallerModal } from './components/common/PWAInstallerModal';
import { RoleSwitcherModal } from './components/auth/RoleSwitcherModal';
import { AuthModal } from './components/auth/AuthModal';

// Views
import { PublicLandingPage } from './components/public/PublicLandingPage';
import { ClientPortalView } from './components/client/ClientPortalView';
import { PublicBookingModal } from './components/booking/PublicBookingModal';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { AgendaView } from './components/agenda/AgendaView';
import { ClientsManager } from './components/clients/ClientsManager';
import { FinancialManager } from './components/financial/FinancialManager';
import { ServicesManager } from './components/services/ServicesManager';
import { ProfessionalsManager } from './components/professionals/ProfessionalsManager';
import { ReportsView } from './components/reports/ReportsView';
import { WhatsAppCenter } from './components/whatsapp/WhatsAppCenter';
import { WaitlistManager } from './components/waitlist/WaitlistManager';
import { PromotionsManager } from './components/promotions/PromotionsManager';
import { SettingsManager } from './components/settings/SettingsManager';
import { AuditLogsView } from './components/audit/AuditLogsView';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>(StorageService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('inicio');

  // Modals
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot' | 'changePassword'>('login');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPWAInstallerOpen, setIsPWAInstallerOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingProfId, setBookingProfId] = useState<string | undefined>(undefined);
  const [bookingServiceId, setBookingServiceId] = useState<string | undefined>(undefined);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  useEffect(() => {
    const handleUserChange = () => {
      const u = StorageService.getCurrentUser();
      setCurrentUser(u);
    };
    return StorageService.subscribeStorage(handleUserChange);
  }, []);

  const handleOpenBooking = (profId?: string, serviceId?: string) => {
    setBookingProfId(profId);
    setBookingServiceId(serviceId);
    setIsBookingModalOpen(true);
  };

  const handleOpenAuthModal = (mode: 'login' | 'register' | 'forgot' | 'changePassword' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(StorageService.getCurrentUser());
    setActiveTab('publica');
  };

  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  const isClientOrGuest = currentUser.role === 'cliente' || currentUser.id === 'visitor_guest';

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col selection:bg-[#c4b491]/30 selection:text-white">
      {/* Header */}
      <Header
        currentUser={currentUser}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenPWAInstaller={() => setIsPWAInstallerOpen(true)}
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab)}
      />

      {/* Main Content View */}
      <main className="flex-1 pb-24 md:pb-12">
        {/* Client or Guest Views */}
        {isClientOrGuest && (
          <>
            {activeTab === 'cliente-portal' ? (
              <ClientPortalView
                currentUser={currentUser}
                onOpenBooking={handleOpenBooking}
                onOpenAuthModal={() => handleOpenAuthModal('login')}
              />
            ) : (
              <PublicLandingPage onOpenBookingModal={handleOpenBooking} />
            )}
          </>
        )}

        {/* Staff/Admin/Professional Views */}
        {!isClientOrGuest && activeTab === 'publica' && (
          <PublicLandingPage onOpenBookingModal={handleOpenBooking} />
        )}

        {!isClientOrGuest && activeTab !== 'publica' && (
          <>
            {activeTab === 'inicio' && (
              <DashboardOverview
                currentUser={currentUser}
                onNavigateTab={tab => setActiveTab(tab)}
                onOpenNewBooking={() => handleOpenBooking()}
                onOpenNewClient={() => setIsNewClientModalOpen(true)}
              />
            )}

            {activeTab === 'agenda' && (
              <AgendaView
                currentUser={currentUser}
                onOpenNewBooking={() => handleOpenBooking()}
              />
            )}

            {activeTab === 'clientes' && (
              <ClientsManager
                isNewModalOpen={isNewClientModalOpen}
                onCloseNewModal={() => setIsNewClientModalOpen(false)}
              />
            )}

            {activeTab === 'financeiro' && (
              <FinancialManager currentUser={currentUser} />
            )}

            {activeTab === 'servicos' && <ServicesManager />}

            {activeTab === 'profissionais' && <ProfessionalsManager />}

            {activeTab === 'relatorios' && <ReportsView />}

            {activeTab === 'whatsapp' && <WhatsAppCenter />}

            {activeTab === 'espera' && <WaitlistManager />}

            {activeTab === 'promocoes' && <PromotionsManager />}

            {activeTab === 'configuracoes' && <SettingsManager />}

            {activeTab === 'logs' && <AuditLogsView />}
          </>
        )}
      </main>

      {/* Bottom Mobile Navigation */}
      <MobileNav
        role={currentUser.role}
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab)}
        onOpenNewBooking={() => handleOpenBooking()}
        onOpenMoreMenu={() => setIsRoleSwitcherOpen(true)}
      />

      {/* Global Modals */}
      <PublicBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialProfId={bookingProfId}
        initialServiceId={bookingServiceId}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
        onUserAuthenticated={u => {
          setCurrentUser(u);
          if (u.role === 'cliente') {
            setActiveTab('cliente-portal');
          } else {
            setActiveTab('inicio');
          }
        }}
      />

      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        currentUser={currentUser}
        onUserChanged={u => {
          setCurrentUser(u);
          if (u.role === 'cliente') {
            setActiveTab('cliente-portal');
          } else {
            setActiveTab('inicio');
          }
        }}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateTab={tab => setActiveTab(tab)}
      />

      <PWAInstallerModal
        isOpen={isPWAInstallerOpen}
        onClose={() => setIsPWAInstallerOpen(false)}
      />
    </div>
  );
}
