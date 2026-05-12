import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X, Wifi, WifiOff } from 'lucide-react';
import type { DashboardSection } from '../types';

interface LayoutProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  isSocketConnected: boolean;
  children: React.ReactNode;
}

export function Layout({ activeSection, onSectionChange, isSocketConnected, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar
          activeSection={activeSection}
          onSectionChange={(section) => {
            onSectionChange(section);
            setSidebarOpen(false);
          }}
        />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="glass flex h-14 items-center justify-between px-4 lg:px-6 border-b border-border shrink-0">
          <button
            id="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-3 ml-auto">
            {/* Socket connection indicator */}
            <div className="flex items-center gap-2 text-sm">
              {isSocketConnected ? (
                <>
                  <Wifi size={14} className="text-success" />
                  <span className="text-text-muted hidden sm:inline">Socket conectado</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-error" />
                  <span className="text-text-muted hidden sm:inline">Socket desconectado</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
