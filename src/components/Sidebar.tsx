import React from 'react';
import { Shield, Car, Bell, Settings, Fingerprint, Activity, LogOut } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('vshield_token');
      navigate('/login');
    } catch (err) {
      console.error('Failed to logout', err);
    }
  };

  return (
    <div className="w-64 bg-emerald-900 text-white min-h-screen flex flex-col">
      <div className="p-6 flex items-center space-x-3 border-b border-emerald-800">
        <Shield className="w-8 h-8 text-emerald-400" />
        <span className="text-2xl font-bold tracking-tight">VShield</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <NavItem to="/dashboard" icon={<Activity />} label="Dashboard" active={location.pathname === '/dashboard'} />
        <NavItem to="/fleet" icon={<Car />} label="Fleet Management" active={location.pathname === '/fleet'} />
        <NavItem to="/biometrics" icon={<Fingerprint />} label="Biometrics" active={location.pathname === '/biometrics'} />
        <NavItem to="/alerts" icon={<Bell />} label="Alerts" badge={1} active={location.pathname === '/alerts'} />
        <NavItem to="/settings" icon={<Settings />} label="Settings" active={location.pathname === '/settings'} />
      </nav>
      
      <div className="p-4 border-t border-emerald-800 space-y-4">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-3 rounded-lg text-emerald-300 hover:bg-emerald-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log Out</span>
        </button>
        <div className="text-xs text-emerald-400/60">
          Google Africa Applied AI Lab<br />
          Document v1.0
        </div>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, active = false, badge }: { to: string, icon: React.ReactNode, label: string, active?: boolean, badge?: number }) {
  return (
    <Link to={to} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${active ? 'bg-emerald-800 text-white' : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'}`}>
      <div className="flex items-center space-x-3">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
        <span className="font-medium">{label}</span>
      </div>
      {badge !== undefined && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}
