import React, { useEffect, useState } from 'react';
import { Car, Lock, Unlock, WifiOff, Plus, Edit2, Trash2, Loader2, AlertCircle, FileText, Upload, Download, ExternalLink } from 'lucide-react';

export interface VehicleDocument {
  blobId: string;
  fileName: string;
  category: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  url: string;
}

interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  status: string;
  documents?: VehicleDocument[];
}

export default function FleetManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentVehicle, setCurrentVehicle] = useState<Partial<Vehicle>>({});
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Document states
  const [docUploadLoading, setDocUploadLoading] = useState(false);
  const [docUploadError, setDocUploadError] = useState('');
  const [docUploadSuccess, setDocUploadSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('vehicle_photo');

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('vshield_token');
      const response = await fetch('/api/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setVehicles(data);
      } else {
        setError(data.error || 'Failed to fetch vehicles');
      }
    } catch (err) {
      setError('An error occurred while fetching vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentVehicle({ status: 'Parked' });
    setModalError('');
    setDocUploadError('');
    setDocUploadSuccess('');
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setModalMode('edit');
    setCurrentVehicle(vehicle);
    setModalError('');
    setDocUploadError('');
    setDocUploadSuccess('');
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    
    try {
      const token = localStorage.getItem('vshield_token');
      const isEdit = modalMode === 'edit';
      const url = isEdit ? `/api/vehicles/${currentVehicle.id}` : '/api/vehicles';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(currentVehicle)
      });
      
      const data = await response.json();
      if (response.ok) {
        setIsModalOpen(false);
        fetchVehicles(); // Refresh the list
      } else {
        setModalError(data.error || 'Failed to save vehicle');
      }
    } catch (err) {
      setModalError('An error occurred while saving the vehicle');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    
    try {
      const token = localStorage.getItem('vshield_token');
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchVehicles();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete vehicle');
      }
    } catch (err) {
      alert('An error occurred while deleting the vehicle');
    }
  };

  const handleDocumentUpload = async () => {
    if (!selectedFile) return;
    if (!currentVehicle.id) return;
    
    setDocUploadLoading(true);
    setDocUploadError('');
    setDocUploadSuccess('');
    
    const token = localStorage.getItem('vshield_token');
    if (!token) {
      setDocUploadError("Your session has expired. Please sign in again.");
      setDocUploadLoading(false);
      return;
    }
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', selectedCategory);
    
    try {
      const response = await fetch(`/api/vehicles/${currentVehicle.id}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setDocUploadSuccess('Document uploaded successfully.');
        setSelectedFile(null);
        const updatedDocs = [...(currentVehicle.documents || []), data.document];
        setCurrentVehicle({...currentVehicle, documents: updatedDocs});
        fetchVehicles();
      } else {
        if (response.status === 401) {
          setDocUploadError("Your session has expired. Please sign in again.");
        } else if (data?.error) {
          setDocUploadError(data.error);
        } else if (response.status === 403) {
          setDocUploadError("You do not have permission to access this document.");
        } else {
          setDocUploadError("Document upload failed. Please try again.");
        }
      }
    } catch (err: any) {
      setDocUploadError("Document upload failed. Please try again.");
    } finally {
      setDocUploadLoading(false);
    }
  };

  const handleDownload = async (blobId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('vshield_token');
      if (!token) {
        alert("Your session has expired. Please sign in again.");
        return;
      }
      const response = await fetch(`/api/vehicles/${currentVehicle.id}/documents/${encodeURIComponent(blobId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        if (response.status === 401) alert("Your session has expired. Please sign in again.");
        else if (response.status === 403) alert("You do not have permission to access this document.");
        else alert("Failed to download document.");
      }
    } catch(err) {
      alert("Failed to download document.");
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Armed': return 'bg-emerald-100 text-emerald-700';
      case 'Driving': return 'bg-blue-100 text-blue-700';
      case 'Immobilized': return 'bg-red-100 text-red-700';
      case 'Parked': return 'bg-gray-100 text-gray-700';
      case 'Maintenance': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Armed': return <Lock className="w-4 h-4 mr-1" />;
      case 'Driving': return <Unlock className="w-4 h-4 mr-1" />;
      case 'Immobilized': return <Lock className="w-4 h-4 mr-1" />;
      case 'Parked': return <Car className="w-4 h-4 mr-1" />;
      default: return null;
    }
  };

  return (
    <>
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Fleet Management</h1>
          <p className="text-gray-500 mt-1">Manage and monitor all vehicles in your fleet.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </button>
      </header>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
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
                  <th className="px-6 py-4 font-medium">Vehicle</th>
                  <th className="px-6 py-4 font-medium">Plate Number</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No vehicles found in your fleet. Click "Add Vehicle" to create one.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-emerald-100 p-2 rounded-lg">
                            <Car className="w-5 h-5 text-emerald-600" />
                          </div>
                          <span className="font-medium text-gray-900">{v.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm">{v.plate_number}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(v.status)}`}>
                          {getStatusIcon(v.status)}
                          {v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-3">
                          <button 
                            onClick={() => openEditModal(v)}
                            className="text-gray-500 hover:text-emerald-600 transition-colors"
                            title="Edit Vehicle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(v.id)}
                            className="text-gray-500 hover:text-red-600 transition-colors"
                            title="Delete Vehicle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'create' ? 'Add New Vehicle' : 'Edit Vehicle'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form id="vehicle-form" onSubmit={handleSave}>
                
              {modalError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
                  {modalError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Name
                  </label>
                  <input
                    type="text"
                    required
                    value={currentVehicle.name || ''}
                    onChange={(e) => setCurrentVehicle({...currentVehicle, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g. Toyota Hilux"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plate Number
                  </label>
                  <input
                    type="text"
                    required
                    value={currentVehicle.plate_number || ''}
                    onChange={(e) => setCurrentVehicle({...currentVehicle, plate_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                    placeholder="e.g. KJA-234AB"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    required
                    value={currentVehicle.status || 'Parked'}
                    onChange={(e) => setCurrentVehicle({...currentVehicle, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="Armed">Armed</option>
                    <option value="Driving">Driving</option>
                    <option value="Immobilized">Immobilized</option>
                    <option value="Parked">Parked</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              
              
            
              </form>

              {modalMode === 'edit' && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-emerald-600" />
                    Vehicle Documents
                  </h3>
                  
                  {/* Upload Section */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Upload New Document</h4>
                    
                    {docUploadError && (
                      <div className="bg-red-50 text-red-700 p-2 rounded mb-3 text-sm flex items-start">
                        <AlertCircle className="w-4 h-4 mr-1.5 mt-0.5 shrink-0" />
                        <span>{docUploadError}</span>
                      </div>
                    )}
                    
                    {docUploadSuccess && (
                      <div className="bg-emerald-50 text-emerald-700 p-2 rounded mb-3 text-sm">
                        {docUploadSuccess}
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Document Category</label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                        >
                          <option value="vehicle_photo">Vehicle Photo</option>
                          <option value="inspection_photo">Inspection Photo</option>
                          <option value="registration_document">Registration Document</option>
                          <option value="ownership_document">Ownership Document</option>
                          <option value="maintenance_document">Maintenance Document</option>
                          <option value="incident_photo">Incident Photo</option>
                          <option value="incident_document">Incident Document</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Select File</label>
                        <input
                          type="file"
                          onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleDocumentUpload}
                        disabled={!selectedFile || docUploadLoading}
                        className="w-full mt-2 py-1.5 bg-emerald-100 text-emerald-700 rounded font-medium text-sm hover:bg-emerald-200 transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        {docUploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {docUploadLoading ? 'Uploading...' : 'Upload Document'}
                      </button>
                    </div>
                  </div>

                  {/* Existing Documents */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Existing Documents</h4>
                    {!currentVehicle.documents || currentVehicle.documents.length === 0 ? (
                      <p className="text-sm text-gray-500 italic text-center py-4">No documents uploaded for this vehicle.</p>
                    ) : (
                      <ul className="space-y-2">
                        {currentVehicle.documents.map((doc, idx) => (
                          <li key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex flex-col overflow-hidden mr-3">
                              <span className="text-sm font-medium text-gray-900 truncate" title={doc.fileName}>{doc.fileName}</span>
                              <div className="flex items-center text-xs text-gray-500 mt-0.5 space-x-2">
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded capitalize">{doc.category.replace('_', ' ')}</span>
                                <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDownload(doc.blobId, doc.fileName)}
                              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors shrink-0"
                              title="Download Document"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="vehicle-form"
                disabled={modalLoading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center text-sm font-medium min-w-[100px]"
              >
                {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
