import React, { useState, useEffect, lazy, Suspense } from 'react';
import { User } from './types';
import { useCoworking } from './context/useCoworking';

// Brand & Common Components
import { Header } from './components/common/Header';
import { MobileNav } from './components/common/MobileNav';
import { SplashScreen } from './components/common/SplashScreen';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { PWAInstallerModal } from './components/common/PWAInstallerModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { AdminLoginPage } from './components/auth/AdminLoginPage';
import { AdminAuthService } from './services/adminAuth';
import { ProfessionalLoginPage } from './components/auth/ProfessionalLoginPage';
import { ProfessionalAuthService } from './services/professionalAuth';
import { ProfessionalAccessManager } from './components/professionals/ProfessionalAccessManager';

// Views - eager load only essential views
import { PublicLandingPage } from './components/public/PublicLandingPage';
import { PublicBookingModal } from './components/booking/PublicBookingModal';

// Views - lazy load to reduce initial bundle
const DashboardOverview = lazy(() => import('./components/dashboard/DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const AgendaView = lazy(() => import('./components/agenda/AgendaView').then(m => ({ default: m.AgendaView })));
const ClientsManager = lazy(() => import('./components/clients/ClientsManager').then(m => ({ default: m.ClientsManager })));
const FinancialManager = lazy(() => import('./components/financial/FinancialManager').then(m => ({ default: m.FinancialManager })));
const ServicesManager = lazy(() => import('./components/services/ServicesManager').then(m => ({ default: m.ServicesManager })));
const ProfessionalsManager = lazy(() => import('./components/professionals/ProfessionalsManager').then(m => ({ default: m.ProfessionalsManager })));
const ReportsView = lazy(() => import('./components/reports/ReportsView').then(m => ({ default: m.ReportsView })));
const WhatsAppCenter = lazy(() => import('./components/whatsapp/WhatsAppCenter').then(m => ({ default: m.WhatsAppCenter })));
const WaitlistManager = lazy(() => import('./components/waitlist/WaitlistManager').then(m => ({ default: m.WaitlistManager })));
const PromotionsManager = lazy(() => import('./components/promotions/PromotionsManager').then(m => ({ default: m.PromotionsManager })));
const SettingsManager = lazy(() => import('./components/settings/SettingsManager').then(m => ({ default: m.SettingsManager })));
const AuditLogsView = lazy(() => import('./components/audit/AuditLogsView').then(m => ({ default: m.AuditLogsView })));

export default function App() {
  const { state: coworkingState, dispatch } = useCoworking();
  const currentUser = coworkingState.currentUser;

  const cleanPath = window.location.pathname.replace(/\/+$/, '');
  const isAdminRoute = cleanPath === '/admin';
  const isProfessionalRoute = cleanPath === '/profissional';
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('inicio');

  // Modals
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPWAInstallerOpen, setIsPWAInstallerOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingProfId, setBookingProfId] = useState<string | undefined>(undefined);
  const [bookingServiceId, setBookingServiceId] = useState<string | undefined>(undefined);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  // User state now comes from context via coworkingState.currentUser
  // No need for manual sync - context handles it automatically

  useEffect(() => {
    if (currentUser.role !== 'admin' && currentUser.role !== 'profissional') return;

    let active = true;
    const syncSharedAgenda = async () => {
      try {
        // TODO: Migrate syncAppointmentsFromCloud to use context after full migration
        // await StorageService.syncAppointmentsFromCloud(currentUser);
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
    // Dispatch logout action to context
    dispatch({ type: 'SET_USER', payload: { id: 'visitor_guest', name: '', email: '', role: 'cliente' } });
    setActiveTab('publica');
  };

  if (isProfessionalRoute && currentUser.role !== 'profissional') {
    return (
      <ProfessionalLoginPage
        onAuthenticated={user => {
          dispatch({ type: 'SET_USER', payload: user });
          setActiveTab('agenda');
        }}
      />
    );
  }

  if (isAdminRoute && currentUser.role !== 'admin') {
    return (
      <AdminLoginPage
        onAuthenticated={user => {
          dispatch({ type: 'SET_USER', payload: user });
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
              <Suspense fallback={<LoadingSpinner message="Carregando dashboard..." />}>
                <DashboardOverview
                  currentUser={currentUser}
                  onNavigateTab={tab => setActiveTab(tab)}
                  onOpenNewBooking={() => handleOpenBooking()}
                  onOpenNewClient={() => setIsNewClientModalOpen(true)}
                />
              </Suspense>
            )}

            {activeTab === 'agenda' && (
              <Suspense fallback={<LoadingSpinner message="Carregando agenda..." />}>
                <AgendaView
                  currentUser={currentUser}
                  onOpenNewBooking={() => handleOpenBooking()}
                />
              </Suspense>
            )}

            {activeTab === 'clientes' && (
              <Suspense fallback={<LoadingSpinner message="Carregando clientes..." />}>
                <ClientsManager
                  isNewModalOpen={isNewClientModalOpen}
                  onCloseNewModal={() => setIsNewClientModalOpen(false)}
                />
              </Suspense>
            )}

            {activeTab === 'financeiro' && (
              <Suspense fallback={<LoadingSpinner message="Carregando financeiro..." />}>
                <FinancialManager currentUser={currentUser} />
              </Suspense>
            )}

            {activeTab === 'servicos' && (
              <Suspense fallback={<LoadingSpinner message="Carregando serviços..." />}>
                <ServicesManager />
              </Suspense>
            )}

            {activeTab === 'profissionais' && (
              <Suspense fallback={<LoadingSpinner message="Carregando profissionais..." />}>
                <ProfessionalsManager />
              </Suspense>
            )}

            {activeTab === 'relatorios' && (
              <Suspense fallback={<LoadingSpinner message="Carregando relatórios..." />}>
                <ReportsView />
              </Suspense>
            )}

            {activeTab === 'whatsapp' && (
              <Suspense fallback={<LoadingSpinner message="Carregando WhatsApp..." />}>
                <WhatsAppCenter currentUser={currentUser} />
              </Suspense>
            )}

            {activeTab === 'espera' && (
              <Suspense fallback={<LoadingSpinner message="Carregando lista de espera..." />}>
                <WaitlistManager />
              </Suspense>
            )}

            {activeTab === 'promocoes' && (
              <Suspense fallback={<LoadingSpinner message="Carregando promoções..." />}>
                <PromotionsManager />
              </Suspense>
            )}

            {activeTab === 'configuracoes' && (
              <Suspense fallback={<LoadingSpinner message="Carregando configurações..." />}>
                <SettingsManager />
              </Suspense>
            )}

            {activeTab === 'logs' && (
              <Suspense fallback={<LoadingSpinner message="Carregando logs..." />}>
                <AuditLogsView />
              </Suspense>
            )}
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
