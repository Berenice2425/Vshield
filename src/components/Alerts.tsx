import React, { useEffect, useState, useContext } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Info, Loader2, MapPin, Clock, Car } from 'lucide-react';
import { AlertContext } from '../App';

interface Alert {
  id: string;
  vehicle: string;
  plate: string;
  type: string;
  severity: string;
  message: string;
  status: string;
  timestamp: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { decrementAlertCount } = useContext(AlertContext);

  // Filtering
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  
  // Detail Modal
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('vshield_token');
      const response = await fetch('/api/alerts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAlerts(data);
      } else {
        setError(data.error || 'Failed to fetch alerts');
      }
    } catch (err) {
      setError('An error occurred while fetching alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const updateAlertStatus = async (id: string, newStatus: string) => {
    setStatusLoading(true);
    try {
      const token = localStorage.getItem('vshield_token');
      const response = await fetch(`/api/alerts/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        const oldAlert = alerts.find(a => a.id === id);
        
        // Update local state to reflect change quickly
        setAlerts(alerts.map(a => a.id === id ? { ...a, status: newStatus } : a));
        if (selectedAlert && selectedAlert.id === id) {
          setSelectedAlert({ ...selectedAlert, status: newStatus });
        }
        
        if (oldAlert && oldAlert.status === 'Active' && (newStatus === 'Acknowledged' || newStatus === 'Resolved')) {
          decrementAlertCount();
        }
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update alert status');
      }
    } catch (err) {
      alert('An error occurred while updating the alert');
    } finally {
      setStatusLoading(false);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch(severity) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Active': return 'bg-red-50 text-red-700';
      case 'Acknowledged': return 'bg-blue-50 text-blue-700';
      case 'Resolved': return 'bg-emerald-50 text-emerald-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch(severity) {
      case 'Critical': return <ShieldAlert className="w-5 h-5 text-red-600" />;
      case 'High': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'Medium': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterSeverity !== 'All' && alert.severity !== filterSeverity) return false;
    if (filterStatus !== 'All' && alert.status !== filterStatus) return false;
    if (filterType !== 'All' && alert.type !== filterType) return false;
    return true;
  });

  const uniqueTypes = Array.from(new Set(alerts.map(a => a.type)));

  return (
    <>
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Security Alerts</h1>
          <p className="text-gray-500 mt-1">Monitor and respond to fleet security events.</p>
        </div>
        <button 
          onClick={fetchAlerts}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
        >
          Refresh Data
        </button>
      </header>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Severity</label>
          <select 
            value={filterSeverity} 
            onChange={e => setFilterSeverity(e.target.value)}
            className="w-full text-sm border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full text-sm border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            className="w-full text-sm border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="All">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-emerald-50/50 text-emerald-800 text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Severity</th>
                  <th className="px-6 py-4 font-medium">Alert Type</th>
                  <th className="px-6 py-4 font-medium">Vehicle</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No alerts match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityStyle(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getAlertIcon(alert.severity)}
                          <span className="ml-2 font-medium text-gray-900">{alert.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{alert.vehicle}</div>
                        <div className="text-xs text-gray-500 font-mono">{alert.plate}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(alert.status)}`}>
                          {alert.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedAlert(alert)}
                          className="text-emerald-600 hover:text-emerald-800 font-medium text-sm transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div className="flex items-center">
                <div className={`p-3 rounded-full mr-4 ${getSeverityStyle(selectedAlert.severity).replace('border', '')}`}>
                  {getAlertIcon(selectedAlert.severity)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedAlert.type}</h2>
                  <p className="text-sm text-gray-500">{new Date(selectedAlert.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-gray-800 font-medium">{selectedAlert.message}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Vehicle Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Car className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-500 w-24">Vehicle:</span>
                      <span className="font-medium text-gray-900">{selectedAlert.vehicle}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Info className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-500 w-24">Plate:</span>
                      <span className="font-mono text-gray-900">{selectedAlert.plate}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Context</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <AlertTriangle className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-500 w-24">Severity:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getSeverityStyle(selectedAlert.severity)}`}>
                        {selectedAlert.severity}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-500 w-24">Status:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(selectedAlert.status)}`}>
                        {selectedAlert.status}
                      </span>
                    </div>
                    {selectedAlert.location?.address && (
                      <div className="flex items-start text-sm">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                        <span className="text-gray-500 w-24 shrink-0">Location:</span>
                        <span className="text-gray-900">{selectedAlert.location.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="text-sm text-gray-500">Update Status:</span>
              <div className="flex space-x-3">
                {selectedAlert.status === 'Active' && (
                  <button
                    onClick={() => updateAlertStatus(selectedAlert.id, 'Acknowledged')}
                    disabled={statusLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {statusLoading ? 'Updating...' : 'Acknowledge'}
                  </button>
                )}
                {selectedAlert.status !== 'Resolved' && (
                  <button
                    onClick={() => updateAlertStatus(selectedAlert.id, 'Resolved')}
                    disabled={statusLoading}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {statusLoading ? 'Updating...' : 'Mark Resolved'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium ml-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
