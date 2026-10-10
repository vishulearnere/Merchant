import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CreditCard, LogOut, RefreshCw, PlusCircle } from 'lucide-react';

interface NavbarProps {
  onOpenCreateModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeTab: 'dashboard' | 'customer_preview';
  setActiveTab: (tab: 'dashboard' | 'customer_preview') => void;
  onOpenWebhookModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateModal,
  onRefresh,
  isRefreshing,
  activeTab,
  setActiveTab,
  onOpenWebhookModal,
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const checkStatus = async () => {
    const health = await api.checkHealth();
    setBackendOnline(health.ok);
  };

  useEffect(() => {
    checkStatus();
    const timer = setInterval(checkStatus, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Pay<span className="text-blue-600">Flow</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Merchant Console
                </span>
              </div>
            </div>

            {isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={onOpenWebhookModal}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <span>Webhook Tester</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                </button>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Live Backend Indicator */}
            <div
              onClick={checkStatus}
              className={`cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                backendOnline
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
              title={
                backendOnline
                  ? 'Backend connected on http://localhost:5000/v1'
                  : 'Backend offline. Run "npm run dev:backend" in your terminal.'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="font-semibold">
                {backendOnline === null
                  ? 'Checking...'
                  : backendOnline
                  ? 'Backend Online (:5000)'
                  : 'Backend Offline'}
              </span>
            </div>

            {isAuthenticated && (
              <>
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 disabled:opacity-50"
                  title="Refresh links"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
                  />
                </button>

                <button
                  onClick={onOpenCreateModal}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-2 rounded-lg text-sm shadow-xs transition-all hover:shadow active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Create Payment Link</span>
                  <span className="sm:hidden">Create</span>
                </button>

                <div className="flex items-center pl-2 sm:pl-3 sm:border-l border-slate-200 gap-2">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-800">{user?.name}</span>
                    <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                      {user?.email}
                    </span>
                  </div>

                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
