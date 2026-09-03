import React, { useEffect, useState } from 'react';
import { Fingerprint, CheckCircle, XCircle, AlertCircle, Loader2, Camera, Car, Info, Check } from 'lucide-react';

interface BiometricEvent {
  id: string;
  vehicleId: string;
  vehicleName: string;
  plate_number: string;
  eventType: string;
  result: string;
  confidence: number;
  timestamp: string;
}

interface BiometricsData {
  status: string;
  message: string;
  events: BiometricEvent[];
  azureConfigured: boolean;
}

export default function Biometrics() {
  const [data, setData] = useState<BiometricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [error, setError] = useState('');

  const fetchBiometrics = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setError('');
      setRefreshSuccess(false);
    }
    
    try {
      const token = localStorage.getItem('vshield_token');
      const response = await fetch('/api/biometrics/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setData(result);
        if (isRefresh) {
          setRefreshSuccess(true);
          setTimeout(() => setRefreshSuccess(false), 3000);
        }
      } else {
        if (response.status === 401 || response.status === 403) {
          setError('Authentication failed. Please sign in again.');
        } else {
          setError(result.error || 'Failed to fetch biometric logs.');
        }
      }
    } catch (err) {
      setError('A network error occurred while fetching biometric logs.');
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchBiometrics();
  }, []);

  const getResultStyle = (result: string) => {
    return result === 'Success' 
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-red-50 text-red-700 border-red-200';
  };

  const getResultIcon = (result: string) => {
    return result === 'Success' 
      ? <CheckCircle className="w-5 h-5 text-emerald-600" />
      : <XCircle className="w-5 h-5 text-red-600" />;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const successCount = data?.events.filter(e => e.result === 'Success').length || 0;
  const failureCount = data?.events.filter(e => e.result === 'Failed').length || 0;

  return (
    <>
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Biometrics</h1>
          <p className="text-gray-500 mt-1">Monitor edge biometric verification events and device status.</p>
        </div>
        <div className="flex items-center space-x-3">
          {refreshSuccess && (
            <span className="flex items-center text-sm text-emerald-600 font-medium animate-in fade-in">
              <Check className="w-4 h-4 mr-1" /> Updated
            </span>
          )}
          <button 
            onClick={() => fetchBiometrics(true)}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh Logs'
            )}
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {data?.message && (
        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl mb-6 flex items-center shadow-sm border border-blue-100">
          <Info className="w-5 h-5 mr-3 shrink-0 text-blue-600" />
          <p className="text-sm">{data.message}</p>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-50 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">System Status</p>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-900 mr-2">Awaiting Device</span>
              <span className="flex h-3 w-3 relative">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
              </span>
            </div>
          </div>
          <div className="p-4 rounded-full bg-emerald-50">
            <Fingerprint className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-50 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Recent Successes</p>
            <p className="text-3xl font-bold text-gray-900">{successCount}</p>
          </div>
          <div className="p-4 rounded-full bg-emerald-50">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-50 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Recent Failures</p>
            <p className="text-3xl font-bold text-gray-900">{failureCount}</p>
          </div>
          <div className="p-4 rounded-full bg-red-50">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Events Table */}
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
            <div className="p-6 border-b border-emerald-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Verification Events</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-emerald-50/50 text-emerald-800 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Result</th>
                    <th className="px-6 py-4 font-medium">Event Type</th>
                    <th className="px-6 py-4 font-medium">Vehicle</th>
                    <th className="px-6 py-4 font-medium">Confidence</th>
                    <th className="px-6 py-4 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {!data?.events || data.events.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No biometric events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    data.events.map((event) => (
                      <tr key={event.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getResultStyle(event.result)}`}>
                            {getResultIcon(event.result)}
                            <span className="ml-1.5">{event.result}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Camera className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">{event.eventType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4 text-emerald-600" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{event.vehicleName}</div>
                              <div className="text-xs text-gray-500 font-mono">{event.plate_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${event.confidence > 0.8 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                                style={{ width: `${Math.round(event.confidence * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{Math.round(event.confidence * 100)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 text-right">
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Storage Configuration</h2>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Azure Blob Storage</span>
                  {data?.azureConfigured ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                      Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                      Missing
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {data?.azureConfigured 
                    ? "Azure Blob Storage is configured for authorized non-biometric vehicle documents (e.g., registration, incident evidence)."
                    : "Azure Storage is not configured. Authorized vehicle documents cannot be uploaded to the cloud."}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Security Note</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Raw biometric templates and feature vectors are processed securely on the edge device (vehicle) and are never transmitted or stored in the central database to maintain privacy compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

