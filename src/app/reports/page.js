'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppShell from '../AppShell';
import { formatCurrency, formatDate, toInputDate } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, FileText, Download } from 'lucide-react';

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
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = business?.name || 'UMKM Admin';
      workbook.created = new Date();

      // Summary sheet
      const summarySheet = workbook.addWorksheet('Ringkasan');
      summarySheet.columns = [
        { header: 'Keterangan', key: 'label', width: 30 },
        { header: 'Jumlah (Rp)', key: 'value', width: 20 },
      ];
      summarySheet.addRow({ label: 'Laporan Keuangan' });
      summarySheet.addRow({ label: `Periode: ${formatDate(startDate)} - ${formatDate(endDate)}` });
      summarySheet.addRow({});
      const summaryRows = [
        { label: 'Total Penjualan', value: totalSales },
        { label: 'Total Pembelian', value: totalPurchases },
        { label: 'Laba Kotor', value: grossProfit },
        { label: 'Total Pemasukan Lain', value: totalIncome },
        { label: 'Total Pengeluaran', value: totalExpense },
        { label: 'Laba Bersih', value: netProfit },
      ];
      summaryRows.forEach(row => summarySheet.addRow(row));
      summarySheet.getRow(1).font = { bold: true, size: 13 };

      // Transactions sheet
      const txSheet = workbook.addWorksheet('Transaksi');
      txSheet.columns = [
        { header: 'No Invoice', key: 'invoiceNo', width: 22 },
        { header: 'Tanggal', key: 'date', width: 14 },
        { header: 'Tipe', key: 'type', width: 12 },
        { header: 'Pelanggan/Supplier', key: 'party', width: 24 },
        { header: 'Subtotal', key: 'subtotal', width: 16 },
        { header: 'Diskon', key: 'discount', width: 14 },
        { header: 'Pajak', key: 'tax', width: 14 },
        { header: 'Total', key: 'total', width: 16 },
        { header: 'Status', key: 'status', width: 14 },
      ];
      transactions.forEach(t => txSheet.addRow({
        invoiceNo: t.invoiceNo,
        date: formatDate(t.date),
        type: t.type === 'SALE' ? 'Penjualan' : 'Pembelian',
        party: t.customer?.name || t.supplier?.name || '-',
        subtotal: t.subtotal || 0,
        discount: t.discount || 0,
        tax: t.tax || 0,
        total: t.total || 0,
        status: t.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas',
      }));
      txSheet.getRow(1).font = { bold: true };

      // Finances sheet
      const finSheet = workbook.addWorksheet('Keuangan');
      finSheet.columns = [
        { header: 'Tanggal', key: 'date', width: 14 },
        { header: 'Tipe', key: 'type', width: 14 },
        { header: 'Kategori', key: 'category', width: 20 },
        { header: 'Deskripsi', key: 'description', width: 30 },
        { header: 'Jumlah', key: 'amount', width: 16 },
      ];
      finances.forEach(f => finSheet.addRow({
        date: formatDate(f.date),
        type: f.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
        category: f.category?.name || '-',
        description: f.description || '-',
        amount: f.amount || 0,
      }));
      finSheet.getRow(1).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeStart = startDate.replace(/[^0-9-]/g, '');
      const safeEnd = endDate.replace(/[^0-9-]/g, '');
      a.href = url;
      a.download = `Laporan_${safeStart}_${safeEnd}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
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
