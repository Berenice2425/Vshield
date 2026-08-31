import React from 'react';
import { Car, AlertTriangle, ShieldCheck } from 'lucide-react';

interface StatsProps {
  stats: {
    totalVehicles: number;
    activeAlerts: number;
    immobilized: number;
  };
}

export default function DashboardStats({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard 
        title="Total Vehicles" 
        value={stats.totalVehicles} 
        icon={<Car className="w-6 h-6 text-emerald-600" />} 
        bgColor="bg-emerald-50"
      />
      <StatCard 
        title="Active Alerts" 
        value={stats.activeAlerts} 
        icon={<AlertTriangle className="w-6 h-6 text-amber-600" />} 
        bgColor="bg-amber-50"
      />
      <StatCard 
        title="Immobilized" 
        value={stats.immobilized} 
        icon={<ShieldCheck className="w-6 h-6 text-red-600" />} 
        bgColor="bg-red-50"
      />
    </div>
  );
}

function StatCard({ title, value, icon, bgColor }: { title: string, value: number, icon: React.ReactNode, bgColor: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-50 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-4 rounded-full ${bgColor}`}>
        {icon}
      </div>
    </div>
  );
}
