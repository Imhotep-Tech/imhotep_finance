import { useState, useRef } from 'react';
import axios from 'axios';

const ImportTransactionsModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const parsePreview = (selectedFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length > 0) {
        const detectedHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        setHeaders(detectedHeaders);

        const rows = lines.slice(1, 6).map(line => {
          return line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        });
        setPreviewRows(rows);
      }
    };
    reader.readAsText(selectedFile);
  };

  const processFile = (selectedFile) => {
    setError('');
    setImportResult(null);

    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a valid .csv file.');
        setFile(null);
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size exceeds the 5MB limit.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      parsePreview(selectedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartImport = async () => {
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
      setStep(3);

      if (response.data.success && response.data.imported_count > 0 && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to import transactions. Please check your file and try again.'
      );
      if (err.response?.data?.errors) {
        setImportResult(err.response.data);
        setStep(3);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'date,amount,currency,trans_status,category,place,trans_details\n2025-01-15,100.00,USD,deposit,Salary,Bank,Monthly salary\n2025-01-16,50.00,USD,withdraw,Food,General,Groceries';
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
    setPreviewRows([]);
    setHeaders([]);
    setImportResult(null);
    setError('');
    setStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#366c6b] dark:text-[#51adac] bg-[#366c6b]/10 dark:bg-[#51adac]/20 px-2.5 py-1 rounded-full">
              Step {step} of 3
            </span>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-chef mt-1">
              Import Transactions
            </h2>
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="px-6 pt-4 flex gap-2">
          {['1. Select File', '2. Verify & Preview', '3. Import Summary'].map((label, idx) => {
            const s = idx + 1;
            const isActive = s === step;
            const isDone = s < step;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (s === 1) setStep(1);
                  else if (s === 2 && file) setStep(2);
                  else if (s === 3 && importResult) setStep(3);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
                  isActive
                    ? 'bg-[#366c6b] text-white shadow'
                    : isDone
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Error Banner */}
        {error && !importResult && (
          <div className="mx-6 mt-4 p-3.5 text-sm text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-800 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* STEP 1: Upload File & Instructions */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Drag and Drop Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-[#366c6b] bg-[#366c6b]/10 scale-[1.01]'
                    : file
                    ? 'border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-900/10'
                    : 'border-gray-300 dark:border-gray-700 hover:border-[#366c6b] bg-gray-50 dark:bg-gray-800/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-file-input"
                />

                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                    file ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40' : 'bg-gray-100 dark:bg-gray-700 text-[#366c6b] dark:text-[#51adac]'
                  }`}>
                    {file ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                  </div>

                  {file ? (
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB — Click to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Drop your CSV file here, or <span className="text-[#366c6b] dark:text-[#51adac] underline">browse</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Max file size: 5MB (UTF-8 formatted .csv)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirements & Template Button */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Required Columns
                  </h4>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="text-xs font-semibold text-[#366c6b] dark:text-[#51adac] hover:underline flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Template CSV
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>• <strong>date</strong>: YYYY-MM-DD</div>
                  <div>• <strong>amount</strong>: e.g. 45.50</div>
                  <div>• <strong>currency</strong>: e.g. USD, EUR</div>
                  <div>• <strong>trans_status</strong>: deposit / withdraw</div>
                </div>
                <p className="text-[11px] text-gray-400 pt-1">
                  Optional columns: category, place, trans_details
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Column Verification */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                    File: {file?.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Showing first {previewRows.length} sample rows parsed from CSV
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full">
                  {headers.length} columns detected
                </span>
              </div>

              {/* Table Preview */}
              <div className="max-h-56 overflow-auto border border-gray-200 dark:border-gray-750 rounded-2xl bg-gray-50/50 dark:bg-gray-800/40">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 sticky top-0">
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 font-bold whitespace-nowrap border-b border-gray-200 dark:border-gray-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-750">
                    {previewRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-gray-100/50 dark:hover:bg-gray-800/50">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/60 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Clicking &quot;Start Import&quot; will validate and create these transactions atomically.</span>
              </div>
            </div>
          )}

          {/* STEP 3: Result Summary */}
          {step === 3 && importResult && (
            <div className="space-y-4">
              <div className={`p-5 rounded-2xl border ${
                importResult.success && importResult.imported_count > 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    importResult.success && importResult.imported_count > 0
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40'
                  }`}>
                    {importResult.success && importResult.imported_count > 0 ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-800 dark:text-gray-100">
                      {importResult.message}
                    </h4>
                    {importResult.imported_count > 0 && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                        ✓ {importResult.imported_count} transaction(s) successfully added to your account
                      </p>
                    )}
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-800/60">
                    <p className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
                      Validation Issues ({importResult.errors.length}):
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1 bg-white/60 dark:bg-gray-900/60 p-2 rounded-xl">
                      {importResult.errors.map((err, idx) => (
                        <div key={idx} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
                          <span>•</span>
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            {step === 1 && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!file}
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2.5 bg-[#366c6b] dark:bg-[#51adac] text-white rounded-xl hover:bg-[#2c5857] dark:hover:bg-[#439190] transition font-semibold shadow disabled:opacity-50"
                >
                  Preview CSV
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleStartImport}
                  className="flex-1 px-4 py-2.5 bg-[#366c6b] dark:bg-[#51adac] text-white rounded-xl hover:bg-[#2c5857] dark:hover:bg-[#439190] transition font-semibold shadow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <span>Start Import</span>
                  )}
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <button
                  type="button"
                  onClick={resetImport}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
                >
                  Import Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-[#366c6b] dark:bg-[#51adac] text-white rounded-xl hover:bg-[#2c5857] dark:hover:bg-[#439190] transition font-semibold shadow"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportTransactionsModal;
