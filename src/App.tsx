import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MerchantLogin } from './components/MerchantLogin';
import { Dashboard } from './components/Dashboard';
import { CustomerPayPage } from './components/CustomerPayPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customer_preview'>('dashboard');
  const [selectedLinkId, setSelectedLinkId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/pay\/([^/]+)/);
    if (match && match[1]) {
      setSelectedLinkId(match[1]);
      setActiveTab('customer_preview');
    }

    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const pathMatch = currentPath.match(/^\/pay\/([^/]+)/);
      if (pathMatch && pathMatch[1]) {
        setSelectedLinkId(pathMatch[1]);
        setActiveTab('customer_preview');
      } else {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenCustomerPay = (linkId: string) => {
    setSelectedLinkId(linkId);
    setActiveTab('customer_preview');
    window.history.pushState({}, '', `/pay/${linkId}`);
  };

  const handleBackToDashboard = () => {
    setActiveTab('dashboard');
    window.history.pushState({}, '', '/');
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (activeTab === 'customer_preview' && selectedLinkId) {
    return (
      <CustomerPayPage
        linkId={selectedLinkId}
        onBackToDashboard={handleBackToDashboard}
        onTriggerWebhookModal={() => {
          setIsWebhookModalOpen(true);
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar
          onOpenCreateModal={() => {}}
          onRefresh={() => {}}
          isRefreshing={false}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenWebhookModal={() => {}}
        />
        <main className="flex-1">
          <MerchantLogin />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
      />

      <main className="flex-1">
        <Dashboard
          onOpenCustomerPay={handleOpenCustomerPay}
          isCreateModalOpen={isCreateModalOpen}
          setIsCreateModalOpen={setIsCreateModalOpen}
          isWebhookModalOpen={isWebhookModalOpen}
          setIsWebhookModalOpen={setIsWebhookModalOpen}
        />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
