import { Activity, BarChart3, ScrollText, MessageSquare } from 'lucide-react';
import type { DashboardSection } from '../types';

interface SidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

const navItems: { id: DashboardSection; label: string; icon: React.ReactNode }[] = [
  { id: 'status', label: 'Estado', icon: <Activity size={20} /> },
  { id: 'metrics', label: 'Métricas', icon: <BarChart3 size={20} /> },
  { id: 'logs', label: 'Logs', icon: <ScrollText size={20} /> },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-bg-secondary border-r border-border p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-whatsapp/15 text-whatsapp shadow-whatsapp/10 shadow-lg">
          <MessageSquare size={22} />
        </div>
        <div>
          <h1 className="text-sm font-bold text-text-primary tracking-tight">WhatsApp Bot</h1>
          <p className="text-[0.65rem] text-whatsapp font-medium uppercase tracking-wider mt-0.5">Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onSectionChange(item.id)}
              className={`
                flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-whatsapp/12 text-whatsapp shadow-[inset_0_0_0_1px_rgba(37,211,102,0.15)]'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }
              `}
            >
              <span className={isActive ? 'text-whatsapp' : ''}>{item.icon}</span>
              {item.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-whatsapp animate-pulse-glow text-whatsapp" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[0.65rem] text-text-muted">
          Oberon 360 © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
