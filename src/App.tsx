/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import ThreatSimulator from './components/ThreatSimulator';
import VehicleList from './components/VehicleList';
import FleetManagement from './components/FleetManagement';
import Alerts from './components/Alerts';
import Biometrics from './components/Biometrics';
import LandingPage from './components/LandingPage';
import Login from './components/Login';

// Create a context for sharing the active alerts count
export const AlertContext = createContext({
  activeAlertsCount: 0,
  decrementAlertCount: () => {}
});

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  // Fetch the count initially and when layout remounts on navigation
  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const token = localStorage.getItem('vshield_token');
        if (!token) return;
        const res = await fetch('/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setActiveAlertsCount(data.activeAlerts);
        }
      } catch (err) {
        console.error("Failed to fetch alert count", err);
      }
    };
    fetchAlertCount();
  }, []);

  const decrementAlertCount = () => {
    setActiveAlertsCount(prev => Math.max(0, prev - 1));
  };

  return (
    <AlertContext.Provider value={{ activeAlertsCount, decrementAlertCount }}>
      <div className="flex min-h-screen bg-slate-50 font-sans">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </AlertContext.Provider>
  );
}

function PlaceholderPage({ title, description }: { title: string, description: string }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const vehicleId = searchParams.get('vehicleId');

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
        <p className="text-gray-500 mt-1">{description}</p>
      </header>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center h-64 text-gray-500">
        <span>{title} content will go here.</span>
        {vehicleId && (
          <span className="mt-2 text-emerald-600 font-medium">
            Currently managing vehicle ID: {vehicleId}
          </span>
        )}
      </div>
    </>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({ totalVehicles: 0, activeAlerts: 0, immobilized: 0 });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('vshield_token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const [statsRes, vehiclesRes] = await Promise.all([
          fetch('/api/dashboard/stats', { headers }),
          fetch('/api/vehicles', { headers })
        ]);
        const statsData = await statsRes.json();
        const vehiclesData = await vehiclesRes.json();
        
        setStats(statsData);
        setVehicles(vehiclesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1">Monitor and secure your vehicles.</p>
      </header>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <DashboardStats stats={stats} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <VehicleList vehicles={vehicles} />
            </div>
            <div className="lg:col-span-1">
              <ThreatSimulator />
            </div>
          </div>
        </>
      )}
    </>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('vshield_token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard Routes */}
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} 
        />
        <Route 
          path="/fleet" 
          element={<ProtectedRoute><DashboardLayout><FleetManagement /></DashboardLayout></ProtectedRoute>} 
        />
        <Route 
          path="/biometrics" 
          element={<ProtectedRoute><DashboardLayout><Biometrics /></DashboardLayout></ProtectedRoute>} 
        />
        <Route 
          path="/alerts" 
          element={<ProtectedRoute><DashboardLayout><Alerts /></DashboardLayout></ProtectedRoute>} 
        />
        <Route 
          path="/settings" 
          element={<ProtectedRoute><DashboardLayout><PlaceholderPage title="Settings" description="System configuration." /></DashboardLayout></ProtectedRoute>} 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
