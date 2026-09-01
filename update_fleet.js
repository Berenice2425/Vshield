import fs from 'fs';

let content = fs.readFileSync('src/components/FleetManagement.tsx', 'utf8');

// 1. Add states
const stateHooks = `  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Document states
  const [docUploadLoading, setDocUploadLoading] = useState(false);
  const [docUploadError, setDocUploadError] = useState('');
  const [docUploadSuccess, setDocUploadSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('vehicle_photo');`;

content = content.replace(/  const \[modalLoading, setModalLoading\] = useState\(false\);\n  const \[modalError, setModalError\] = useState\(''\);/, stateHooks);

// 2. Add handlers
const handlers = `  const getStatusStyle = (status: string) => {`;
const insertHandlers = `  const handleDocumentUpload = async () => {
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
      const response = await fetch(\`/api/vehicles/\${currentVehicle.id}/documents\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${token}\`
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
        } else if (response.status === 403) {
          setDocUploadError("You do not have permission to access this document.");
        } else if (response.status === 400 && data.error) {
          setDocUploadError(data.error);
        } else {
          setDocUploadError("Document upload failed. Please try again.");
        }
      }
    } catch (err) {
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
      const response = await fetch(\`/api/vehicles/\${currentVehicle.id}/documents/\${encodeURIComponent(blobId)}\`, {
        headers: {
          'Authorization': \`Bearer \${token}\`
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

  const getStatusStyle = (status: string) => {`;

content = content.replace(handlers, insertHandlers);

// 3. Reset document states on modal open
content = content.replace(/    setModalMode\('create'\);\n    setCurrentVehicle\(\{ status: 'Parked' \}\);\n    setModalError\(''\);\n    setIsModalOpen\(true\);/, `    setModalMode('create');\n    setCurrentVehicle({ status: 'Parked' });\n    setModalError('');\n    setDocUploadError('');\n    setDocUploadSuccess('');\n    setSelectedFile(null);\n    setIsModalOpen(true);`);

content = content.replace(/    setModalMode\('edit'\);\n    setCurrentVehicle\(vehicle\);\n    setModalError\(''\);\n    setIsModalOpen\(true\);/, `    setModalMode('edit');\n    setCurrentVehicle(vehicle);\n    setModalError('');\n    setDocUploadError('');\n    setDocUploadSuccess('');\n    setSelectedFile(null);\n    setIsModalOpen(true);`);

// 4. Modify Modal UI
const modalRegex = /<div className="fixed inset-0 bg-black\/50 flex items-center justify-center z-50 p-4">\s*<div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">/;
const newModalHeader = `<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">`;

content = content.replace(modalRegex, newModalHeader);

const originalFormRegex = /<form onSubmit=\{handleSave\} className="p-6">([\s\S]*?)<\/form>/;
const originalFormMatch = content.match(originalFormRegex);
if (originalFormMatch) {
  const formContent = originalFormMatch[1];
  
  // Extract the submit buttons div
  const buttonRegex = /<div className="mt-6 flex justify-end space-x-3">[\s\S]*?<\/div>/;
  const buttonMatch = formContent.match(buttonRegex);
  
  const innerFormWithoutButtons = formContent.replace(buttonRegex, '');
  
  const newModalBody = `<div className="flex-1 overflow-y-auto p-6">
              <form id="vehicle-form" onSubmit={handleSave}>
                ${innerFormWithoutButtons}
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
            </div>`;
            
  content = content.replace(originalFormRegex, newModalBody);
}

fs.writeFileSync('src/components/FleetManagement.tsx', content);
