import { useState, useRef } from 'react';
import axios from 'axios';

const ImportTransactionsModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    setImportResult(null);
    
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file.');
        setFile(null);
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file to import.');
      return;
    }

    setLoading(true);
    setError('');
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        '/api/finance-management/transaction/import-csv/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setImportResult(response.data);
      
      if (response.data.success && response.data.imported_count > 0) {
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to import transactions. Please check your file and try again.'
      );
      if (err.response?.data?.errors) {
        setImportResult(err.response.data);
      }
    }
    setLoading(false);
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'date,amount,currency,trans_status,category,trans_details\n2025-01-15,100.00,USD,deposit,Salary,Monthly salary\n2025-01-16,50.00,USD,withdraw,Food,Groceries';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transactions_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const resetImport = () => {
    setFile(null);
    setImportResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="flex items-start sm:items-center justify-center min-h-screen p-4">
        <div
          className="rounded-2xl shadow-2xl max-w-md w-full p-6 relative chef-card mx-auto my-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          style={{
            maxHeight: 'calc(100vh - 4rem)',
            overflowY: 'auto',
          }}
        >
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            Import Transactions
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Instructions */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                CSV Format Requirements
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li><strong>Required columns:</strong> date, amount, currency, trans_status</li>
                <li><strong>Optional columns:</strong> category, trans_details</li>
                <li><strong>Date format:</strong> YYYY-MM-DD (e.g., 2025-01-15)</li>
                <li><strong>trans_status:</strong> deposit or withdraw</li>
                <li><strong>Max file size:</strong> 5MB | <strong>Max rows:</strong> 1000</li>
              </ul>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Template CSV
              </button>
            </div>

            {/* File Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Select CSV File
              </label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-file-input"
                />
                <label
                  htmlFor="csv-file-input"
                  className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-[#366c6b] dark:hover:border-[#4a7c7a] transition-colors bg-gray-50 dark:bg-gray-800"
                >
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {file ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{file.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">CSV files only</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className={`p-4 rounded-lg border ${
                importResult.success && importResult.imported_count > 0
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex items-center mb-2">
                  {importResult.success && importResult.imported_count > 0 ? (
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  <span className={`font-semibold ${
                    importResult.success && importResult.imported_count > 0 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {importResult.message}
                  </span>
                </div>
                
                {importResult.imported_count > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    ✓ {importResult.imported_count} transaction(s) imported successfully
                  </p>
                )}
                
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                      Errors ({importResult.errors.length}):
                    </p>
                    <div className="max-h-32 overflow-y-auto">
                      <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-1">•</span>
                            <span>{err}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && !importResult && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="chef-button-secondary dark:text-gray-100 dark:bg-gray-800"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              {importResult && (
                <button
                  type="button"
                  className="chef-button-secondary dark:text-gray-100 dark:bg-gray-800"
                  onClick={resetImport}
                  disabled={loading}
                >
                  Import Another
                </button>
              )}
              <button
                type="submit"
                className="chef-button bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                disabled={loading || !file}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ImportTransactionsModal;
