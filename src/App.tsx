import React, { useState, useEffect } from 'react';
import { User } from './types';
import { StorageService } from './services/storage';

// Brand & Common Components
import { Header } from './components/common/Header';
import { MobileNav } from './components/common/MobileNav';
import { SplashScreen } from './components/common/SplashScreen';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { PWAInstallerModal } from './components/common/PWAInstallerModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AdminLoginPage } from './components/auth/AdminLoginPage';
import { AdminAuthService } from './services/adminAuth';
import { ProfessionalLoginPage } from './components/auth/ProfessionalLoginPage';
import { ProfessionalAuthService } from './services/professionalAuth';
import { ProfessionalAccessManager } from './components/professionals/ProfessionalAccessManager';

// Views
import { PublicLandingPage } from './components/public/PublicLandingPage';
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
  const cleanPath = window.location.pathname.replace(/\/+$/, '');
  const isAdminRoute = cleanPath === '/admin';
  const isProfessionalRoute = cleanPath === '/profissional';
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>(() => StorageService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('inicio');

  // Modals
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPWAInstallerOpen, setIsPWAInstallerOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingProfId, setBookingProfId] = useState<string | undefined>(undefined);
  const [bookingServiceId, setBookingServiceId] = useState<string | undefined>(undefined);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const handleUserChange = () => {
      if (!isMounted) return;
      Promise.resolve().then(() => {
        if (isMounted) {
          const u = StorageService.getCurrentUser();
          setCurrentUser(u);
        }
      });
    };
    const unsubscribe = StorageService.subscribeStorage(handleUserChange);
    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (currentUser.role !== 'admin' && currentUser.role !== 'profissional') return;

    let active = true;
    const syncSharedAgenda = async () => {
      try {
        await StorageService.syncAppointmentsFromCloud(currentUser);
      } catch (error) {
        if (active) console.error('Erro ao atualizar agenda compartilhada:', error);
      }
    };

    void syncSharedAgenda();
    const intervalId = window.setInterval(syncSharedAgenda, 10000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [currentUser.id, currentUser.role]);

  const handleOpenBooking = (profId?: string, serviceId?: string) => {
    setBookingProfId(profId);
    setBookingServiceId(serviceId);
    setIsBookingModalOpen(true);
  };

  const handleLogout = () => {
    if (isAdminRoute) {
      void AdminAuthService.signOut().finally(() => window.location.assign('/admin'));
      return;
    }
    if (isProfessionalRoute) {
      ProfessionalAuthService.signOut();
      window.location.assign('/profissional');
      return;
    }
    StorageService.logout();
    setCurrentUser(StorageService.getCurrentUser());
    setActiveTab('publica');
  };

  if (isProfessionalRoute && currentUser.role !== 'profissional') {
    return (
      <ProfessionalLoginPage
        onAuthenticated={user => {
          setCurrentUser(user);
          setActiveTab('agenda');
        }}
      />
    );
  }

  if (isAdminRoute && currentUser.role !== 'admin') {
    return (
      <AdminLoginPage
        onAuthenticated={user => {
          setCurrentUser(user);
          setActiveTab('inicio');
        }}
      />
    );
  }

  if (!isAdminRoute && !isProfessionalRoute && showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  const isClientOrGuest = currentUser.role === 'cliente' || currentUser.id === 'visitor_guest';

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col selection:bg-[#c4b491]/30 selection:text-white">
      {/* Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenPWAInstaller={() => setIsPWAInstallerOpen(true)}
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab)}
      />

      {/* Main Content View */}
      <main className="flex-1 pb-24 md:pb-12">
        {isAdminRoute && currentUser.role === 'admin' && <ProfessionalAccessManager />}
        {/* Client or Guest Views */}
        {isClientOrGuest && <PublicLandingPage onOpenBookingModal={handleOpenBooking} />}

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

            {activeTab === 'whatsapp' && <WhatsAppCenter currentUser={currentUser} />}

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
        onOpenMoreMenu={() => setActiveTab('inicio')}
      />

      {/* Global Modals */}
      <PublicBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialProfId={bookingProfId}
        initialServiceId={bookingServiceId}
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
    </ErrorBoundary>
  );
}
