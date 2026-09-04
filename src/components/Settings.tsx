import React, { useEffect, useState } from 'react';
import { User, Shield, Database, Cloud, Cpu, Server, Info, Lock, Fingerprint, Activity, CheckCircle, AlertCircle } from 'lucide-react';

interface UserProfile {
  name?: string;
  email: string;
}

export default function Settings() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('vshield_token');
        if (!token) {
          window.location.href = '/login';
          return;
        }
        
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/login';
          return;
        }
        
        if (!res.ok) {
          throw new Error('Failed to fetch account information');
        }
        
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error("Account fetch error:", err);
        setError("Could not load account details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">System & Security Configuration</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Account Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            ) : user ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Name</p>
                  <p className="text-base text-gray-900">{user.name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Email</p>
                  <p className="text-base text-gray-900">{user.email}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-md w-fit">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm font-medium">Authentication: JWT Protected</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Security Architecture */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden lg:row-span-2">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Security Architecture</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex gap-4">
              <div className="bg-emerald-100 p-2 rounded-lg h-fit">
                <Fingerprint className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900">Biometric Processing</h3>
                <p className="text-sm text-emerald-600 font-medium mt-1 mb-1">Edge-only</p>
                <p className="text-sm text-gray-600">Raw biometric templates, images, and embeddings are not stored in cloud services.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-emerald-100 p-2 rounded-lg h-fit">
                <Database className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900">Database</h3>
                <p className="text-sm text-gray-600 mt-1">MongoDB</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-emerald-100 p-2 rounded-lg h-fit">
                <Cloud className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900">Cloud Document Storage</h3>
                <p className="text-sm text-gray-600 mt-1">Azure Blob Storage</p>
                <p className="text-sm text-gray-500 mt-1">Private container / authenticated access</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-emerald-100 p-2 rounded-lg h-fit">
                <Cpu className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900">AI Threat Analysis</h3>
                <p className="text-sm text-gray-600 mt-1">Google Gemini</p>
              </div>
            </div>
          </div>
        </div>

        {/* Edge Device Status */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Edge Device Status</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Biometric Device</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <Activity className="w-3.5 h-3.5" />
                Awaiting Device
              </span>
            </div>
            <p className="text-sm text-gray-600">
              No live edge-device heartbeat is currently connected. The system is awaiting hardware provisioning.
            </p>
          </div>
        </div>

        {/* Application Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Application Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 font-medium">Product</p>
              <p className="text-base text-gray-900 mt-1">VShield</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Version</p>
              <p className="text-base text-gray-900 mt-1">v1.0</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Environment</p>
              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <p className="text-base text-gray-900">Production</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
