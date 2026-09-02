import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '../../store/useAppStore';
import { mockAIAnalysis } from '../../utils/helpers';
import {
  Upload, FileText, Microscope, AlertTriangle, CheckCircle,
  Brain, X, Eye, Clock, ChevronDown
} from 'lucide-react';
import Loader from '../../components/ui/Loader';

export default function MedicalReports() {
  const { addToast } = useAppStore();
  const [files, setFiles] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [reportType, setReportType] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type,
      date: new Date().toLocaleDateString(),
      preview: URL.createObjectURL(file),
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    addToast({ type: 'success', message: `${acceptedFiles.length} file(s) uploaded successfully!` });
  }, [addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'], 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const handleAIAnalysis = () => {
    setAnalyzing(true);
    setAnalysis(null);
    setTimeout(() => {
      setAnalysis(mockAIAnalysis());
      setAnalyzing(false);
      addToast({ type: 'success', message: 'AI Analysis complete!' });
    }, 3000);
  };

  const reportTypes = ['CT Scan', 'MRI', 'X-Ray', 'Blood Report', 'Pathology', 'ECG', 'Ultrasound', 'Other'];

  const mockHistory = [
    { name: 'Chest_Xray_Mar2026.jpg', type: 'X-Ray', date: 'Mar 28, 2026', status: 'Analyzed' },
    { name: 'Blood_Report_Feb2026.pdf', type: 'Blood Report', date: 'Feb 15, 2026', status: 'Uploaded' },
    { name: 'ECG_Jan2026.pdf', type: 'ECG', date: 'Jan 20, 2026', status: 'Analyzed' },
    { name: 'MRI_Brain_Dec2025.jpg', type: 'MRI', date: 'Dec 10, 2025', status: 'Analyzed' },
  ];

  return (
    <div className="page-wrapper">
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
            <FileText size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
            Medical Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            Upload and analyze your medical reports with AI
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Upload Section */}
            <div>
              <div className="glass-card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Report Type</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {reportTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setReportType(type)}
                      className="pill-slot"
                      style={{
                        background: reportType === type ? 'var(--accent-teal)' : 'var(--glass-bg)',
                        color: reportType === type ? '#0a0f1e' : 'var(--text-secondary)',
                        borderColor: reportType === type ? 'var(--accent-teal)' : 'var(--glass-border)',
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div
                  {...getRootProps()}
                  className={`upload-zone ${isDragActive ? 'active' : ''}`}
                >
                  <input {...getInputProps()} />
                  <motion.div animate={{ y: isDragActive ? -5 : 0 }}>
                    <Upload size={48} style={{ color: isDragActive ? 'var(--accent-teal)' : 'var(--text-tertiary)', marginBottom: 16 }} />
                    <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>
                      {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                      Supports PDF, JPG, PNG (max 10MB)
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Uploaded Files */}
              {files.length > 0 && (
                <div className="glass-card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Uploaded Files</h3>
                  {files.map((file, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)', marginBottom: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FileText size={20} style={{ color: 'var(--accent-teal)' }} />
                        <div>
                          <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{file.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{file.size}</p>
                        </div>
                      </div>
                      <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                        <X size={18} />
                      </button>
                    </motion.div>
                  ))}

                  <motion.button
                    className="clay-btn clay-btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
                    onClick={handleAIAnalysis}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={analyzing}
                  >
                    <Microscope size={18} /> 🔬 Analyze with AI
                  </motion.button>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div>
              {/* AI Analysis Results */}
              <AnimatePresence>
                {analyzing && (
                  <motion.div
                    className="glass-card"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ marginBottom: 24 }}
                  >
                    <Loader text="AI is analyzing your report..." />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {analysis && !analyzing && (
                  <motion.div
                    className="glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 24 }}
                  >
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Brain size={20} style={{ color: 'var(--accent-purple)' }} /> AI Analysis Results
                    </h3>

                    <div style={{ marginBottom: 16 }}>
                      <span className={`badge ${analysis.severity === 'Low-Medium' ? 'badge-orange' : 'badge-red'}`}>
                        Severity: {analysis.severity}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
                      {analysis.summary}
                    </p>

                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>Findings</h4>
                    {analysis.findings.map((finding, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)', marginBottom: 6,
                      }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{finding.area}</span>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{finding.status}</p>
                        </div>
                        <span className={`badge ${finding.status.includes('Normal') ? 'badge-teal' : 'badge-orange'}`}>
                          {finding.confidence}
                        </span>
                      </div>
                    ))}

                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '16px 0 12px' }}>Recommendations</h4>
                    {analysis.recommendations.map((rec, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: '0.85rem' }}>
                        <CheckCircle size={16} style={{ color: 'var(--accent-teal)', flexShrink: 0, marginTop: 2 }} />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Report History */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>
                  <Clock size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: -3 }} />
                  Report History
                </h3>
                {mockHistory.map((report, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: i < mockHistory.length - 1 ? '1px solid var(--glass-border)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-secondary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <FileText size={18} style={{ color: 'var(--accent-blue)' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{report.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{report.type} · {report.date}</p>
                      </div>
                    </div>
                    <span className={`badge ${report.status === 'Analyzed' ? 'badge-teal' : 'badge-blue'}`}>
                      {report.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
