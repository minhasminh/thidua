import React, { useState } from 'react';
import { User } from '../types';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { Breadcrumb } from '../components/Breadcrumb';

interface MainLayoutProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentUser,
  onUserChange,
  activeTab,
  onNavigate,
  onLogout,
  children
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Fixed Header */}
      <Header
        currentUser={currentUser}
        onUserChange={onUserChange}
        onNavigate={onNavigate}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={onLogout}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onNavigate={onNavigate}
          currentUser={currentUser}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {/* Breadcrumb Navigation */}
          <Breadcrumb
            currentTab={activeTab}
            onNavigateHome={() => onNavigate('dashboard')}
          />

          {children}
        </main>
      </div>
    </div>
  );
};
