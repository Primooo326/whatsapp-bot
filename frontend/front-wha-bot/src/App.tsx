import { useState } from 'react';
import { Layout } from './components/Layout';
import { StatusPanel } from './components/StatusPanel';
import { MetricsPanel } from './components/MetricsPanel';
import { LogsPanel } from './components/LogsPanel';
import { useWhatsApp } from './hooks/useWhatsApp';
import type { DashboardSection } from './types';

function App() {
  const [activeSection, setActiveSection] = useState<DashboardSection>('status');
  const whatsapp = useWhatsApp();

  return (
    <Layout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      isSocketConnected={whatsapp.isSocketConnected}
    >
      {activeSection === 'status' && (
        <StatusPanel
          status={whatsapp.status}
          qrCode={whatsapp.qrCode}
          isReady={whatsapp.isReady}
          loadingPercent={whatsapp.loadingPercent}
          statusMessage={whatsapp.statusMessage}
          lastUpdated={whatsapp.lastUpdated}
        />
      )}
      {activeSection === 'metrics' && <MetricsPanel />}
      {activeSection === 'logs' && <LogsPanel />}
    </Layout>
  );
}

export default App;
