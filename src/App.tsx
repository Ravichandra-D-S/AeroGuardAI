import { useState } from 'react';
import type { PageId } from '@/types/aircraft';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DashboardPage } from '@/pages/DashboardPage';
import { FleetMonitoringPage } from '@/pages/FleetMonitoringPage';
import { AircraftDetailsPage } from '@/pages/AircraftDetailsPage';
import { PredictionPage } from '@/pages/PredictionPage';
import { MaintenancePlannerPage } from '@/pages/MaintenancePlannerPage';
import { ReportsPage } from '@/pages/ReportsPage';

function App() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [selectedAircraft, setSelectedAircraft] = useState<string>('A-104');
  const [predictionAircraft, setPredictionAircraft] = useState<string | undefined>(undefined);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleNavigate = (target: PageId, aircraftId?: string) => {
    if (aircraftId) {
      if (target === 'prediction') {
        setPredictionAircraft(aircraftId);
      } else {
        setSelectedAircraft(aircraftId);
      }
    }
    if (target === 'prediction' && !aircraftId) {
      setPredictionAircraft(undefined);
    }
    setPage(target);
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'fleet':
        return <FleetMonitoringPage onNavigate={handleNavigate} />;
      case 'aircraft-details':
        return <AircraftDetailsPage aircraftId={selectedAircraft} onNavigate={handleNavigate} />;
      case 'prediction':
        return <PredictionPage presetAircraftId={predictionAircraft} onNavigate={handleNavigate} />;
      case 'planner':
        return <MaintenancePlannerPage onNavigate={handleNavigate} />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar
        current={page}
        onNavigate={handleNavigate}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="lg:pl-64">
        <Header onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;
