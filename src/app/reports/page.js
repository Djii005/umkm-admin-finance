'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppShell from '../AppShell';
import { TrendingUp, TrendingDown, DollarSign, FileText, Download } from 'lucide-react';

function formatCurrency(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
}
function formatDate(d) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));
}
function toInputDate(d) {
  return new Date(d).toISOString().split('T')[0];
}

export default function ReportsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [finances, setFinances] = useState([]);
  const [business, setBusiness] = useState(null);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(toInputDate(firstDayOfMonth));
  const [endDate, setEndDate] = useState(toInputDate(today));

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadReport();
      fetch('/api/settings').then(r => r.json()).then(setBusiness).catch(() => {});
    }
  }, [status]);

  async function loadReport() {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const [txRes, finRes] = await Promise.all([
        fetch(`/api/transactions?startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/finances?startDate=${startDate}&endDate=${endDate}`),
      ]);
      const [txData, finData] = await Promise.all([txRes.json(), finRes.json()]);
      setTransactions(Array.isArray(txData) ? txData : []);
      setFinances(Array.isArray(finData) ? finData : []);
    } catch {
      setTransactions([]);
      setFinances([]);
    } finally {
      setLoading(false);
    }
  }

  const sales = transactions.filter(t => t.type === 'SALE');
  const purchases = transactions.filter(t => t.type === 'PURCHASE');
  const incomes = finances.filter(f => f.type === 'INCOME');
  const expenses = finances.filter(f => f.type === 'EXPENSE');

  const totalSales = sales.reduce((s, t) => s + (t.total || 0), 0);
  const totalPurchases = purchases.reduce((s, t) => s + (t.total || 0), 0);
  const totalIncome = incomes.reduce((s, f) => s + (f.amount || 0), 0);
  const totalExpense = expenses.reduce((s, f) => s + (f.amount || 0), 0);
  const grossProfit = totalSales - totalPurchases;
  const netProfit = grossProfit + totalIncome - totalExpense;

  // Category breakdown for finances
  const categoryMap = {};
  [...incomes, ...expenses].forEach(f => {
    const key = f.category?.name || 'Tanpa Kategori';
    if (!categoryMap[key]) categoryMap[key] = { name: key, income: 0, expense: 0 };
    if (f.type === 'INCOME') categoryMap[key].income += f.amount || 0;
    else categoryMap[key].expense += f.amount || 0;
  });
  const categoryBreakdown = Object.values(categoryMap);

  async function exportExcel() {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Laporan Keuangan'],
        [`Periode: ${formatDate(startDate)} - ${formatDate(endDate)}`],
        [''],
        ['Ringkasan'],
        ['Total Penjualan', totalSales],
        ['Total Pembelian', totalPurchases],
        ['Laba Kotor', grossProfit],
        ['Total Pemasukan Lain', totalIncome],
        ['Total Pengeluaran', totalExpense],
        ['Laba Bersih', netProfit],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

      // Transactions sheet
      const txHeaders = ['No Invoice', 'Tanggal', 'Tipe', 'Pelanggan/Supplier', 'Subtotal', 'Diskon', 'Pajak', 'Total', 'Status'];
      const txRows = transactions.map(t => [
        t.invoiceNo,
        formatDate(t.date),
        t.type === 'SALE' ? 'Penjualan' : 'Pembelian',
        t.customer?.name || t.supplier?.name || '-',
        t.subtotal || 0,
        t.discount || 0,
        t.tax || 0,
        t.total || 0,
        t.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas',
      ]);
      const wsTx = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
      XLSX.utils.book_append_sheet(wb, wsTx, 'Transaksi');

      // Finances sheet
      const finHeaders = ['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Metode', 'Jumlah'];
      const finRows = finances.map(f => [
        formatDate(f.date),
        f.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
        f.category?.name || '-',
        f.description || '-',
        f.paymentMethod || '-',
        f.amount || 0,
      ]);
      const wsFin = XLSX.utils.aoa_to_sheet([finHeaders, ...finRows]);
      XLSX.utils.book_append_sheet(wb, wsFin, 'Keuangan');

      const safeStart = startDate.replace(/[^0-9-]/g, '');
      const safeEnd = endDate.replace(/[^0-9-]/g, '');
      XLSX.writeFile(wb, `Laporan_${safeStart}_${safeEnd}.xlsx`);
    } catch (err) {
      console.error('Export Excel gagal:', err);
    }
  }

  async function exportPDF() {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      const biz = business || { name: 'Toko Saya' };

      // Header
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('LAPORAN KEUANGAN', 105, 12, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(biz.name, 105, 19, { align: 'center' });
      doc.text(`Periode: ${formatDate(startDate)} - ${formatDate(endDate)}`, 105, 26, { align: 'center' });

      doc.setTextColor(50, 50, 50);
      let y = 40;

      // Summary
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Ringkasan', 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [['Keterangan', 'Jumlah']],
        body: [
          ['Total Penjualan', formatCurrency(totalSales)],
          ['Total Pembelian', formatCurrency(totalPurchases)],
          ['Laba Kotor', formatCurrency(grossProfit)],
          ['Total Pemasukan Lain', formatCurrency(totalIncome)],
          ['Total Pengeluaran', formatCurrency(totalExpense)],
          ['Laba Bersih', formatCurrency(netProfit)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });

      y = doc.lastAutoTable.finalY + 12;

      // Transactions
      if (transactions.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Transaksi', 14, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head: [['No Invoice', 'Tanggal', 'Tipe', 'Total', 'Status']],
          body: transactions.map(t => [
            t.invoiceNo,
            formatDate(t.date),
            t.type === 'SALE' ? 'Penjualan' : 'Pembelian',
            formatCurrency(t.total),
            t.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas',
          ]),
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          margin: { left: 14, right: 14 },
        });

        y = doc.lastAutoTable.finalY + 12;
      }

      // Finances breakdown
      if (categoryBreakdown.length > 0 && y < 220) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Rincian per Kategori', 14, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head: [['Kategori', 'Pemasukan', 'Pengeluaran', 'Selisih']],
          body: categoryBreakdown.map(c => [
            c.name,
            formatCurrency(c.income),
            formatCurrency(c.expense),
            formatCurrency(c.income - c.expense),
          ]),
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          margin: { left: 14, right: 14 },
        });
      }

      doc.save(`Laporan_${startDate.replace(/[^0-9-]/g, '')}_${endDate.replace(/[^0-9-]/g, '')}.pdf`);
    } catch (err) {
      console.error('Export PDF gagal:', err);
    }
  }

  return (
    <AppShell pageTitle="Laporan">
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan Keuangan</h1>
          <p className="page-subtitle">Analisis performa bisnis Anda</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={exportExcel} disabled={loading}>
            <Download size={14} /> Excel
          </button>
          <button className="btn btn-secondary" onClick={exportPDF} disabled={loading}>
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
            <label className="form-label">Tanggal Mulai</label>
            <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
            <label className="form-label">Tanggal Akhir</label>
            <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={loadReport} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
            Tampilkan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><span className="spinner" /></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Total Penjualan</span>
                <div className="stat-card-icon blue"><TrendingUp size={18} /></div>
              </div>
              <div className="stat-card-value">{formatCurrency(totalSales)}</div>
              <div className="stat-card-trend">{sales.length} transaksi</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Total Pembelian</span>
                <div className="stat-card-icon red"><TrendingDown size={18} /></div>
              </div>
              <div className="stat-card-value">{formatCurrency(totalPurchases)}</div>
              <div className="stat-card-trend">{purchases.length} transaksi</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Pemasukan Lain</span>
                <div className="stat-card-icon green"><TrendingUp size={18} /></div>
              </div>
              <div className="stat-card-value" style={{ color: '#34d399' }}>{formatCurrency(totalIncome)}</div>
              <div className="stat-card-trend">{incomes.length} entri</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Pengeluaran</span>
                <div className="stat-card-icon red"><TrendingDown size={18} /></div>
              </div>
              <div className="stat-card-value" style={{ color: '#f87171' }}>{formatCurrency(totalExpense)}</div>
              <div className="stat-card-trend">{expenses.length} entri</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Laba Kotor</span>
                <div className={`stat-card-icon ${grossProfit >= 0 ? 'green' : 'red'}`}><DollarSign size={18} /></div>
              </div>
              <div className="stat-card-value" style={{ color: grossProfit >= 0 ? '#34d399' : '#f87171' }}>
                {formatCurrency(grossProfit)}
              </div>
              <div className="stat-card-trend">Penjualan − Pembelian</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Laba Bersih</span>
                <div className={`stat-card-icon ${netProfit >= 0 ? 'green' : 'red'}`}><DollarSign size={18} /></div>
              </div>
              <div className="stat-card-value" style={{ color: netProfit >= 0 ? '#34d399' : '#f87171', fontSize: 20 }}>
                {formatCurrency(netProfit)}
              </div>
              <div className={`stat-card-trend ${netProfit >= 0 ? 'up' : 'down'}`}>
                {netProfit >= 0 ? 'Untung' : 'Rugi'}
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {categoryBreakdown.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 className="card-title">Rincian per Kategori (Keuangan)</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Kategori</th>
                      <th>Pemasukan</th>
                      <th>Pengeluaran</th>
                      <th>Selisih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryBreakdown.map((c, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{c.name}</td>
                        <td style={{ color: '#34d399' }}>{formatCurrency(c.income)}</td>
                        <td style={{ color: '#f87171' }}>{formatCurrency(c.expense)}</td>
                        <td style={{ fontWeight: 600, color: c.income - c.expense >= 0 ? '#34d399' : '#f87171' }}>
                          {formatCurrency(c.income - c.expense)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {transactions.length > 0 && (
            <div className="card">
              <h3 className="card-title">Transaksi dalam Periode</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No Invoice</th>
                      <th>Tanggal</th>
                      <th>Tipe</th>
                      <th>Pelanggan/Supplier</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t.id}>
                        <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--blue-400)' }}>{t.invoiceNo}</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(t.date)}</td>
                        <td>
                          <span className={`badge ${t.type === 'SALE' ? 'badge-success' : 'badge-info'}`}>
                            {t.type === 'SALE' ? 'Penjualan' : 'Pembelian'}
                          </span>
                        </td>
                        <td>{t.customer?.name || t.supplier?.name || '-'}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(t.total)}</td>
                        <td>
                          <span className={`badge ${t.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                            {t.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {transactions.length === 0 && finances.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <FileText size={32} className="empty-state-icon" />
                <p className="empty-state-text">Tidak ada data dalam periode yang dipilih</p>
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
