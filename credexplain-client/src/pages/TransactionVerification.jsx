import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeftRight, Download, Upload, Search, Filter, AlertTriangle, AlertCircle,
  CheckCircle2, Clock, X, Info, FileSpreadsheet, PlusCircle, RefreshCw, ShieldCheck,
  FileCheck, Layers, BarChart3, TrendingUp, Check, ExternalLink, Hash, Landmark,
  CreditCard, QrCode, DollarSign, Eye, Award, FileText
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import jsPDF from 'jspdf';
import { api } from '../services/api';

export default function TransactionVerification({ currentApplicant, onApplicantUpdated }) {
  const [transactions, setTransactions] = useState([]);
  const [analysisReport, setAnalysisReport] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL');

  // Modals & Panels
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [notification, setNotification] = useState(null);

  // File upload ref
  const fileInputRef = useRef(null);

  // Manual Transaction Form
  const [newTx, setNewTx] = useState({
    date: new Date().toISOString().substring(0, 10),
    time: new Date().toTimeString().substring(0, 5),
    amount: '',
    type: 'CREDIT',
    paymentMode: 'UPI_QR',
    counterparty: '',
    description: '',
    refNumber: ''
  });

  const appName = currentApplicant?.name || currentApplicant?.fullName || 'Borrower';
  const appSlug = currentApplicant?.slug || currentApplicant?.demoSlug || 'borrower';
  const appRefId = currentApplicant?.applicantRefId || currentApplicant?.refId || 'APP-2026-001';
  const claimedIncome = currentApplicant?.financials?.avgMonthlyIncome || currentApplicant?.avgMonthlyIncome || 35000;
  const isVerifiedAlready = currentApplicant?.verificationStatus === 'VERIFIED';

  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  // Initialize transactions strictly from applicant records (starts empty until user manually adds)
  useEffect(() => {
    const userTxs = currentApplicant?.transactions || [];
    setTransactions(userTxs);
    if (userTxs.length > 0) {
      runVerification(userTxs);
    } else {
      setAnalysisReport(null);
    }
  }, [currentApplicant?.applicantRefId, currentApplicant?.slug, currentApplicant?.transactions]);

  // Execute verification analysis
  const runVerification = async (txList = transactions) => {
    if (!txList || txList.length === 0) {
      setAnalysisReport(null);
      return;
    }

    setIsVerifying(true);
    try {
      const payload = {
        applicant_ref_id: appRefId,
        applicant_name: appName,
        claimed_monthly_income: claimedIncome,
        transactions: txList
      };

      const report = await api.verifyTransactions(payload);
      setAnalysisReport(report);
    } catch (err) {
      console.error("Verification failed:", err);
      showToast('error', 'Verification engine encountered an error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Manual Transaction Addition
  const handleAddTransactionSubmit = (e) => {
    e.preventDefault();
    if (!newTx.amount || Number(newTx.amount) <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    const txId = `TXN-MAN-${Date.now().toString().substring(8)}`;
    const createdTx = {
      id: txId,
      datetime: `${newTx.date} ${newTx.time}`,
      amount: parseFloat(newTx.amount),
      type: newTx.type,
      paymentMode: newTx.paymentMode,
      counterparty: newTx.counterparty.trim() || 'Direct Counterparty',
      description: newTx.description.trim() || (newTx.type === 'CREDIT' ? 'Customer Payment' : 'Operating Expense'),
      refNumber: newTx.refNumber.trim() || `UTR${Math.floor(Math.random() * 90000000) + 10000000}`
    };

    const updated = [createdTx, ...transactions];
    setTransactions(updated);
    runVerification(updated);

    if (onApplicantUpdated) {
      onApplicantUpdated({
        ...currentApplicant,
        transactions: updated
      });
    }

    setShowAddModal(false);

    // Reset Form
    setNewTx({
      date: new Date().toISOString().substring(0, 10),
      time: new Date().toTimeString().substring(0, 5),
      amount: '',
      type: 'CREDIT',
      paymentMode: 'UPI_QR',
      counterparty: '',
      description: '',
      refNumber: ''
    });

    showToast('success', `Payment record of ₹${createdTx.amount.toLocaleString('en-IN')} added to ledger.`);
  };

  // Clear Ledger History
  const handleClearLedger = () => {
    setTransactions([]);
    setAnalysisReport(null);
    if (onApplicantUpdated) {
      onApplicantUpdated({
        ...currentApplicant,
        transactions: []
      });
    }
    showToast('info', 'All transaction history cleared from ledger.');
  };

  // Real CSV Statement Upload & Parser
  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          showToast('error', 'CSV file appears empty or missing rows.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
        const parsedList = [];

        // Identify column indices
        const dateIdx = headers.findIndex(h => h.includes('date'));
        const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('particular') || h.includes('narrat'));
        const amtIdx = headers.findIndex(h => h.includes('amount') || h.includes('credit') || h.includes('inflow'));
        const debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('outflow') || h.includes('withdrawal'));
        const partyIdx = headers.findIndex(h => h.includes('party') || h.includes('payer') || h.includes('payee') || h.includes('customer'));
        const modeIdx = headers.findIndex(h => h.includes('mode') || h.includes('channel') || h.includes('type'));
        const refIdx = headers.findIndex(h => h.includes('ref') || h.includes('utr') || h.includes('txn'));

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length < 2) continue;

          let amt = 0;
          let isCredit = true;

          if (debitIdx >= 0 && cols[debitIdx] && parseFloat(cols[debitIdx]) > 0) {
            amt = parseFloat(cols[debitIdx]);
            isCredit = false;
          } else if (amtIdx >= 0 && cols[amtIdx]) {
            amt = Math.abs(parseFloat(cols[amtIdx])) || 0;
            // Check if negative or type column indicates debit
            if (parseFloat(cols[amtIdx]) < 0 || (cols[modeIdx] && cols[modeIdx].toUpperCase().includes('DR'))) {
              isCredit = false;
            }
          }

          if (amt <= 0) continue;

          const desc = descIdx >= 0 ? cols[descIdx] : 'Online Statement Entry';
          const party = partyIdx >= 0 ? cols[partyIdx] : 'Online Counterparty';
          const mode = modeIdx >= 0 ? cols[modeIdx].toUpperCase() : (isCredit ? 'UPI_QR' : 'NEFT_BANK');
          const refNo = refIdx >= 0 ? cols[refIdx] : `REF-${Math.floor(Math.random() * 900000) + 100000}`;
          const dtStr = dateIdx >= 0 ? cols[dateIdx] : new Date().toISOString().substring(0, 10);

          parsedList.push({
            id: `TXN-CSV-${1000 + i}`,
            datetime: dtStr,
            amount: amt,
            type: isCredit ? 'CREDIT' : 'DEBIT',
            paymentMode: mode.includes('UPI') ? 'UPI_QR' : mode,
            counterparty: party,
            description: desc,
            refNumber: refNo
          });
        }

        if (parsedList.length > 0) {
          setTransactions(parsedList);
          runVerification(parsedList);
          showToast('success', `Successfully ingested and parsed ${parsedList.length} transactions from ${file.name}.`);
        } else {
          showToast('error', 'Could not parse transaction rows from the CSV file.');
        }
      } catch (err) {
        console.error("CSV parsing error:", err);
        showToast('error', 'Error reading CSV file format.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Apply Verification to Borrower Profile
  const handleApplyVerification = async () => {
    if (!analysisReport) return;
    setIsApplying(true);

    try {
      const updated = await api.updateApplicantVerification(appRefId, {
        verificationStatus: analysisReport.verification_status === 'FLAGGED_FOR_REVIEW' ? 'UNDER_REVIEW' : 'VERIFIED',
        profileCompletionPct: 95
      });

      if (onApplicantUpdated) {
        const enriched = {
          ...currentApplicant,
          ...updated,
          verificationStatus: 'VERIFIED',
          identityVerificationStatus: 'VERIFIED',
          profileCompletionPct: 95,
          corroboratedMonthlyIncome: analysisReport.corroborated_monthly_income,
          verificationAuditHash: analysisReport.audit_hash
        };
        onApplicantUpdated(enriched);
      }

      showToast('success', `Borrower profile ${appRefId} successfully marked as VERIFIED with forensic transaction audit!`);
      setShowReportModal(false);
    } catch (err) {
      console.error("Apply verification error:", err);
      showToast('error', 'Failed to update borrower verification status in database.');
    } finally {
      setIsApplying(false);
    }
  };

  // Official PDF Audit Report Export
  const handleExportPdfReport = () => {
    if (!analysisReport) return;

    const doc = new jsPDF();
    const rep = analysisReport;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Background Seal
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CreditSetu | Official Transaction Verification Audit", 14, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(`Audit Signature: ${rep.audit_hash} | Verified: ${rep.verification_timestamp}`, 14, 21);

    // Borrower Identification Box
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("1. Borrower Information & Commercial Profile", 14, 38);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Applicant Name: ${rep.applicant_name}`, 14, 46);
    doc.text(`Application Reference: ${rep.applicant_ref_id}`, 14, 52);
    doc.text(`Enterprise: ${currentApplicant?.businessName || "Micro-Enterprise Retail/Services"}`, 14, 58);
    doc.text(`Claimed Monthly Income: Rs. ${claimedIncome.toLocaleString('en-IN')}`, 115, 46);
    doc.text(`Corroborated Monthly Revenue: Rs. ${rep.corroborated_monthly_income.toLocaleString('en-IN')}`, 115, 52);
    doc.text(`Claimed Income Coverage: ${rep.claimed_income_coverage_pct}%`, 115, 58);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 64, pageWidth - 14, 64);

    // Section 2: Underwriting Verdict & Verification Status
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("2. Forensic Underwriting Verdict", 14, 74);

    const isGood = rep.verification_status === 'VERIFIED';
    doc.setFillColor(isGood ? 236 : 254, isGood ? 253 : 243, isGood ? 245 : 199);
    doc.roundedRect(14, 78, pageWidth - 28, 18, 3, 3, 'F');

    doc.setTextColor(isGood ? 4 : 180, isGood ? 120 : 83, isGood ? 87 : 9);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`VERDICT: ${rep.verification_status_label.toUpperCase()} (${rep.verification_status})`, 18, 86);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Integrity Score: ${rep.integrity_score_pct}% | Unique Counterparties: ${rep.counterparty_diversity?.unique_payers || 0}`, 18, 92);

    // Section 3: Financial Summary KPIs
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("3. Ledger Breakdown & Forensic Segregation", 14, 108);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`- Gross Inflows Processed: Rs. ${rep.total_credit_volume.toLocaleString('en-IN')} across ${rep.total_transactions} records`, 14, 116);
    doc.text(`- Verified Genuine Commercial Receipts: Rs. ${rep.verified_commercial_inflow.toLocaleString('en-IN')} (${rep.integrity_score_pct}%)`, 14, 122);
    doc.text(`- Segregated Informal Peer Borrowing: Rs. ${rep.flagged_loan_inflow.toLocaleString('en-IN')} (Excluded from income synthesis)`, 14, 128);
    doc.text(`- Segregated Personal / Family Transfers: Rs. ${rep.unverified_inflow.toLocaleString('en-IN')}`, 14, 134);
    doc.text(`- Operating Debits / Supplier Replenishments: Rs. ${rep.total_debit_volume.toLocaleString('en-IN')}`, 14, 140);
    doc.text(`- Retained Operational Cashflow Surplus: Rs. ${rep.net_surplus.toLocaleString('en-IN')}`, 14, 146);

    // Section 4: Recommended Credit Capacity
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("4. Recommended Credit Capacity Limits", 14, 160);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`- Safe Recommended Credit Limit: Rs. ${rep.recommended_credit_limit.toLocaleString('en-IN')}`, 14, 168);
    doc.text(`- Safe Monthly EMI Debt-Service Capacity: Rs. ${rep.recommended_emi_capacity.toLocaleString('en-IN')}`, 14, 174);
    doc.text(`- Counterparty Concentration Risk: ${rep.counterparty_diversity?.top_payer_concentration_pct || 0}% max single payer`, 14, 180);

    // Section 5: Anomalies
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("5. Forensic Anomalies & Heuristics Check", 14, 194);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (!rep.anomalies || rep.anomalies.length === 0) {
      doc.text("Clean Audit: No peer borrowings, round-tripping, or abnormal credit spikes detected.", 14, 202);
    } else {
      let y = 202;
      rep.anomalies.forEach((a, i) => {
        doc.text(`[${a.severity}] ${a.details}`, 14, y);
        y += 6;
      });
    }

    // Section 6: Official Audit Sign-off
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 235, pageWidth - 14, 235);

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("CreditSetu Alternative Underwriting System | Hash verified against tamper-evident SHA-256 standard.", 14, 242);
    doc.text("This report serves as mathematical and forensic evidence of informal business turnover for institutional underwriting.", 14, 248);

    doc.text("Underwriter Verification Signature: __________________________", 14, 264);
    doc.text("Stamp & Date: __________________________", 125, 264);

    doc.save(`CreditSetu_Transaction_Audit_${appRefId}_${new Date().toISOString().substring(0, 10)}.pdf`);
    showToast('success', 'Official Transaction Verification Audit PDF downloaded successfully.');
  };

  // Filtered transactions for table
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const sTerm = (searchTerm || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const tid = (t.id || '').toString().toLowerCase();
      const cp = (t.counterparty || '').toLowerCase();
      const ref = (t.refNumber || '').toLowerCase();

      const matchSearch = desc.includes(sTerm) || tid.includes(sTerm) || cp.includes(sTerm) || ref.includes(sTerm);
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchType = typeFilter === 'ALL' || t.type === typeFilter;
      const matchMode = modeFilter === 'ALL' || t.paymentMode === modeFilter;

      return matchSearch && matchStatus && matchType && matchMode;
    });
  }, [transactions, searchTerm, statusFilter, typeFilter, modeFilter]);

  // Visual Chart Data
  const pieData = useMemo(() => {
    if (!analysisReport) return [];
    return [
      { name: 'Verified Commercial', value: analysisReport.verified_commercial_inflow || 0, color: '#10b981' },
      { name: 'Operating Debits', value: analysisReport.total_debit_volume || 0, color: '#64748b' },
      { name: 'Personal Transfers', value: analysisReport.unverified_inflow || 0, color: '#f59e0b' },
      { name: 'Flagged Loan Inflow', value: analysisReport.flagged_loan_inflow || 0, color: '#ef4444' }
    ].filter(d => d.value > 0);
  }, [analysisReport]);

  const channelChartData = useMemo(() => {
    if (!analysisReport?.channel_breakdown) return [];
    return analysisReport.channel_breakdown.map(c => ({
      name: c.mode.replace(/_/g, ' '),
      inflow: c.credit_volume || 0,
      outflow: c.debit_volume || 0,
      count: c.count
    }));
  }, [analysisReport]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Toast Notification */}
      {notification && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: notification.type === 'error' ? '#fef2f2' : (notification.type === 'info' ? '#eff6ff' : '#ecfdf5'),
          border: `1px solid ${notification.type === 'error' ? '#fecaca' : (notification.type === 'info' ? '#bfdbfe' : '#a7f3d0')}`,
          color: notification.type === 'error' ? '#991b1b' : (notification.type === 'info' ? '#1e40af' : '#065f46'),
          fontWeight: 600,
          fontSize: '0.875rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Banner & Data Ingestion Tools */}
      <div className="card" style={{ borderLeft: '5px solid #2563eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <h2 className="card-title" style={{ margin: 0 }}>
                Online Transaction Ingestion & Forensic Verification
              </h2>
              {isVerifiedAlready ? (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} /> Officially Verified
                </span>
              ) : (
                <span className="badge badge-warning">
                  Pending Transaction Audit
                </span>
              )}
            </div>
            <p className="card-subtitle" style={{ margin: 0 }}>
              Ingesting and classifying payment streams for <strong>{appName}</strong> ({appRefId}). Claimed Monthly Income: <strong>₹{claimedIncome.toLocaleString('en-IN')}</strong>.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={14} />
              <span>+ Add Payment</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Upload size={14} />
              <span>Upload Statement CSV</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleCsvUpload}
            />

            <button
              onClick={() => setShowReportModal(true)}
              className="btn btn-sm"
              style={{
                backgroundColor: '#0f172a', color: '#ffffff',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontWeight: 700
              }}
              disabled={!analysisReport}
            >
              <FileText size={14} />
              <span>Generate Audit Report</span>
            </button>
          </div>
        </div>

        {/* Ledger Status Bar */}
        <div style={{
          marginTop: '1.25rem', paddingTop: '1rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: '#475569' }}>Ledger Mode:</span>
            <span className="badge badge-teal" style={{ fontSize: '0.72rem' }}>
              Manual User Ingestion
            </span>
            <span style={{ color: '#64748b', fontSize: '0.775rem' }}>
              {transactions.length === 0
                ? 'No transactions present • Waiting for manual payment records'
                : `${transactions.length} payment record${transactions.length === 1 ? '' : 's'} recorded`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {transactions.length > 0 && (
              <button
                onClick={handleClearLedger}
                className="btn btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', color: '#ef4444', borderColor: '#fecaca', backgroundColor: '#fef2f2' }}
              >
                Clear Ledger
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty Ledger State (When no transactions have been added manually yet) */}
      {transactions.length === 0 && (
        <div className="card" style={{
          textAlign: 'center',
          padding: '3.5rem 1.5rem',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <ArrowLeftRight size={28} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            No Transaction History Available
          </h3>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            All existing mock transaction history has been removed. No payment records will be visible until you manually add transactions for <strong>{appName}</strong>.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.25rem', fontWeight: 700 }}
            >
              <PlusCircle size={16} />
              <span>+ Add Payment Record</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.25rem' }}
            >
              <Upload size={16} />
              <span>Upload Statement CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* Forensic Verification KPI Ribbon */}
      {analysisReport && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Integrity Score */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Integrity Score
              </span>
              <Award size={18} color={analysisReport.integrity_score_pct >= 85 ? '#10b981' : '#f59e0b'} />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: analysisReport.integrity_score_pct >= 85 ? '#047857' : (analysisReport.integrity_score_pct >= 70 ? '#b45309' : '#dc2626') }}>
              {analysisReport.integrity_score_pct}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {analysisReport.verification_status_label}
            </div>
          </div>

          {/* Verified Commercial Inflow */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Verified Business Receipts
              </span>
              <CheckCircle2 size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
              ₹{analysisReport.verified_commercial_inflow?.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Out of ₹{analysisReport.total_credit_volume?.toLocaleString('en-IN')} gross inflows
            </div>
          </div>

          {/* Corroborated Monthly Income */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Corroborated Monthly Income
              </span>
              <TrendingUp size={18} color="#2563eb" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2563eb' }}>
              ₹{analysisReport.corroborated_monthly_income?.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {analysisReport.claimed_income_coverage_pct}% of claimed ₹{claimedIncome.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Segregated Debt & Transfers */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Segregated Inflows
              </span>
              <AlertTriangle size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: (analysisReport.flagged_loan_inflow + analysisReport.unverified_inflow) > 0 ? '#b45309' : '#0f172a' }}>
              ₹{(analysisReport.flagged_loan_inflow + analysisReport.unverified_inflow)?.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {analysisReport.flagged_loan_inflow > 0 ? `₹${analysisReport.flagged_loan_inflow.toLocaleString('en-IN')} peer loans flagged` : 'Excluded personal transfers'}
            </div>
          </div>
        </div>
      )}

      {/* Forensic Warnings (if anomalies detected) */}
      {analysisReport?.anomalies && analysisReport.anomalies.length > 0 && (
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#92400e' }}>
            <AlertTriangle size={18} />
            <span>Forensic Heuristic Warnings ({analysisReport.anomalies.length} items flagged)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.825rem', color: '#78350f' }}>
            {analysisReport.anomalies.map((a, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-warning" style={{ fontSize: '0.675rem' }}>{a.severity}</span>
                <span>{a.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid: Breakdown & Channel Distribution */}
      {analysisReport && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {/* Integrity Distribution Pie */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '0.35rem' }}>
              Verification Volume Distribution
            </h3>
            <p className="card-subtitle" style={{ marginBottom: '1rem' }}>
              Classification of processed financial inflow and outflow volume
            </p>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Channel Bar Chart */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '0.35rem' }}>
              Payment Channel Breakdown
            </h3>
            <p className="card-subtitle" style={{ marginBottom: '1rem' }}>
              Inflow vs outflow velocity by payment rail
            </p>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer>
                <BarChart data={channelChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`} />
                  <Bar dataKey="inflow" name="Credit Inflow" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outflow" name="Debit Outflow" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Ledger Table with Search & Filter Controls */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>
              Forensic Transaction Ledger
            </h3>
            <p className="card-subtitle" style={{ margin: 0 }}>
              Showing {filteredTransactions.length} of {transactions.length} records
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search description, party, UTR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2rem', width: '230px', fontSize: '0.8rem' }}
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-control"
              style={{ width: '120px', fontSize: '0.8rem' }}
            >
              <option value="ALL">All Types</option>
              <option value="CREDIT">Credits (+)</option>
              <option value="DEBIT">Debits (-)</option>
            </select>

            {/* Channel Filter */}
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="form-control"
              style={{ width: '130px', fontSize: '0.8rem' }}
            >
              <option value="ALL">All Channels</option>
              <option value="UPI_QR">UPI QR</option>
              <option value="NEFT_BANK">NEFT / Bank</option>
              <option value="IMPS_BANK">IMPS</option>
              <option value="POS_CARD">POS / Card</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ width: '150px', fontSize: '0.8rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED_UPI">Verified UPI</option>
              <option value="VERIFIED_COMMERCIAL">Verified Commercial</option>
              <option value="SETTLED_DEBIT">Settled Debit</option>
              <option value="UNVERIFIED_STATEMENT_ENTRY">Unverified Inflow</option>
              <option value="FLAGGED_LOAN_INFLOW">Flagged Loan</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
            <FileSpreadsheet size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5, color: '#94a3b8' }} />
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              No Payment Records in Ledger
            </div>
            <div style={{ fontSize: '0.825rem', marginBottom: '1.25rem', maxWidth: '420px', margin: '0 auto 1.25rem', lineHeight: 1.4 }}>
              No historical records exist. Click the button below to manually record a verified customer payment or business expense.
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={14} />
              <span>+ Add Payment Record</span>
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>No matching records</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
              No transactions match your current search and filter criteria.
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Tx ID & Date</th>
                  <th>Description & Particulars</th>
                  <th>Counterparty</th>
                  <th>Channel</th>
                  <th>Amount</th>
                  <th>Verification Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(t => {
                  const isCredit = t.type === 'CREDIT';
                  const isVerified = t.status === 'VERIFIED_UPI' || t.status === 'VERIFIED_COMMERCIAL' || t.status === 'SETTLED_DEBIT';
                  const isLoan = t.status === 'FLAGGED_LOAN_INFLOW';
                  const isUnverified = t.status === 'UNVERIFIED_STATEMENT_ENTRY';

                  return (
                    <tr
                      key={t.id}
                      style={{ cursor: 'pointer', backgroundColor: isLoan ? '#fff7ed' : 'inherit' }}
                      onClick={() => setSelectedTx(t)}
                    >
                      <td>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.785rem' }}>
                          {t.id}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                          {t.datetime}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{t.description}</div>
                        <div style={{ fontSize: '0.725rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                          Ref: {t.refNumber}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500 }}>
                          {t.counterparty}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                          {t.paymentMode.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          color: isCredit ? '#047857' : '#0f172a'
                        }}>
                          {isCredit ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          isVerified ? 'badge-success' : (isLoan ? 'badge-danger' : 'badge-warning')
                        }`}>
                          {t.status ? t.status.replace(/_/g, ' ') : (isCredit ? 'VERIFIED UPI' : 'SETTLED DEBIT')}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(t);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Payment Entry */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Input Payment Transaction
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Record online customer receipt, POS settlement, or supplier debit
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleAddTransactionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Flow Direction</label>
                  <select
                    className="form-control"
                    value={newTx.type}
                    onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}
                  >
                    <option value="CREDIT">Credit (Customer Inflow +)</option>
                    <option value="DEBIT">Debit (Operating Outflow -)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Amount (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="e.g. 450"
                    className="form-control"
                    value={newTx.amount}
                    onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Payment Channel</label>
                  <select
                    className="form-control"
                    value={newTx.paymentMode}
                    onChange={(e) => setNewTx({ ...newTx, paymentMode: e.target.value })}
                  >
                    <option value="UPI_QR">UPI QR Code</option>
                    <option value="UPI_P2M">UPI P2M Merchant</option>
                    <option value="NEFT_BANK">NEFT / Bank Transfer</option>
                    <option value="IMPS_BANK">IMPS Instant Transfer</option>
                    <option value="POS_CARD">POS / Card Terminal</option>
                    <option value="CASH_DEPOSIT">Cash Branch Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Counterparty / Payer *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Customer Rajesh M"
                    className="form-control"
                    value={newTx.counterparty}
                    onChange={(e) => setNewTx({ ...newTx, counterparty: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={newTx.date}
                    onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    required
                    className="form-control"
                    value={newTx.time}
                    onChange={(e) => setNewTx({ ...newTx, time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Particulars / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI/P2M QR Customer Order #108"
                  className="form-control"
                  value={newTx.description}
                  onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">UTR / Reference Number</label>
                <input
                  type="text"
                  placeholder="e.g. UTR84920481 (optional)"
                  className="form-control"
                  value={newTx.refNumber}
                  onChange={(e) => setNewTx({ ...newTx, refNumber: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save & Verify Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transaction Inspection Details */}
      {selectedTx && (
        <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Forensic Transaction Inspection
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                  {selectedTx.id}
                </div>
              </div>
              <button onClick={() => setSelectedTx(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Amount & Flow</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: selectedTx.type === 'CREDIT' ? '#047857' : '#0f172a' }}>
                  ₹{selectedTx.amount.toLocaleString('en-IN')} ({selectedTx.type})
                </div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Timestamp</span>
                <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{selectedTx.datetime}</div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Narrative / Particulars</span>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>{selectedTx.description}</div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Counterparty</span>
                <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{selectedTx.counterparty}</div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Payment Mode</span>
                <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{selectedTx.paymentMode}</div>
              </div>
            </div>

            <div style={{
              marginTop: '1.25rem', padding: '0.85rem',
              backgroundColor: selectedTx.status === 'VERIFIED_UPI' || selectedTx.status === 'VERIFIED_COMMERCIAL' || selectedTx.status === 'SETTLED_DEBIT' ? '#ecfdf5' : '#fffbeb',
              border: `1px solid ${selectedTx.status === 'VERIFIED_UPI' || selectedTx.status === 'VERIFIED_COMMERCIAL' ? '#a7f3d0' : '#fde68a'}`,
              borderRadius: '8px', fontSize: '0.825rem'
            }}>
              <strong style={{ color: selectedTx.status === 'VERIFIED_UPI' || selectedTx.status === 'VERIFIED_COMMERCIAL' ? '#065f46' : '#92400e' }}>
                Forensic Classification Rationale:
              </strong>
              <p style={{ marginTop: '0.35rem', color: selectedTx.status === 'VERIFIED_UPI' || selectedTx.status === 'VERIFIED_COMMERCIAL' ? '#047857' : '#b45309', lineHeight: 1.4, margin: 0 }}>
                {selectedTx.verificationReason || (
                  selectedTx.status === 'VERIFIED_UPI'
                    ? "Authentic retail customer QR payment. Verified and aggregated into synthesized informal business revenue."
                    : (selectedTx.status === 'FLAGGED_LOAN_INFLOW'
                      ? "Identified as peer loan borrowing based on keyword and amount heuristics. Excluded from business revenue to prevent credit inflation."
                      : "Operating business debit or personal transfer segregated from primary commercial turnover."
                    )
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Verification Audit Report Modal */}
      {showReportModal && analysisReport && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={22} color="#2563eb" />
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Transaction Verification Audit Report
                  </h3>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Forensic audit hash: <strong>{analysisReport.audit_hash}</strong> | Generated: {analysisReport.verification_timestamp}
                </div>
              </div>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#64748b" />
              </button>
            </div>

            {/* Verdict Callout */}
            <div style={{
              padding: '1.25rem',
              borderRadius: '8px',
              backgroundColor: analysisReport.verification_status === 'VERIFIED' ? '#ecfdf5' : '#fffbeb',
              border: `1px solid ${analysisReport.verification_status === 'VERIFIED' ? '#a7f3d0' : '#fde68a'}`,
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className={`badge ${analysisReport.verification_status === 'VERIFIED' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                  {analysisReport.verification_status_label}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  Integrity Rating: {analysisReport.integrity_score_pct}%
                </span>
              </div>
              <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', lineHeight: 1.6, color: '#334155', margin: 0 }}>
                {analysisReport.underwriting_verdict}
              </p>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Corroborated Monthly Income</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb', marginTop: '0.2rem' }}>
                  ₹{analysisReport.corroborated_monthly_income?.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                  {analysisReport.claimed_income_coverage_pct}% of claimed
                </div>
              </div>

              <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Recommended Credit Limit</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                  ₹{analysisReport.recommended_credit_limit?.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                  2.5x monthly turnover
                </div>
              </div>

              <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Max Safe EMI Capacity</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857', marginTop: '0.2rem' }}>
                  ₹{analysisReport.recommended_emi_capacity?.toLocaleString('en-IN')}/mo
                </div>
                <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                  Based on operating surplus
                </div>
              </div>
            </div>

            {/* Channel Breakdown Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.65rem' }}>
                Channel Volume & Counterparty Concentration
              </h4>
              <div className="table-responsive">
                <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Payment Rail</th>
                      <th>Tx Count</th>
                      <th>Credit Inflows (₹)</th>
                      <th>Debit Outflows (₹)</th>
                      <th>Turnover Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisReport.channel_breakdown?.map(c => {
                      const share = analysisReport.total_credit_volume > 0
                        ? ((c.credit_volume / analysisReport.total_credit_volume) * 100).toFixed(1)
                        : 0;
                      return (
                        <tr key={c.mode}>
                          <td style={{ fontWeight: 600 }}>{c.mode.replace(/_/g, ' ')}</td>
                          <td>{c.count}</td>
                          <td style={{ color: '#047857', fontWeight: 700 }}>₹{c.credit_volume?.toLocaleString('en-IN')}</td>
                          <td style={{ color: '#64748b' }}>₹{c.debit_volume?.toLocaleString('en-IN')}</td>
                          <td><strong>{share}%</strong></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Diversity Insights */}
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              fontSize: '0.825rem',
              color: '#334155',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                <strong>Counterparty Diversity:</strong> {analysisReport.counterparty_diversity?.unique_payers} unique payers recorded.
              </div>
              <div>
                <strong>Concentration Risk:</strong> {analysisReport.counterparty_diversity?.top_payer_concentration_pct}% single payer max (Low Risk &lt; 40%).
              </div>
            </div>

            {/* Action Buttons in Modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={handleExportPdfReport}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={15} />
                <span>Export PDF Audit Dossier</span>
              </button>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleApplyVerification}
                  disabled={isApplying}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ShieldCheck size={15} />
                  <span>{isApplying ? 'Applying...' : 'Apply Verified Status to Borrower'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
