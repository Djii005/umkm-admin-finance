'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppShell from '../AppShell';
import Modal from '@/components/Modal';
import { Plus, Eye, Printer } from 'lucide-react';
import { generateInvoicePDF } from '@/components/InvoicePDF';
import Link from 'next/link';

function formatCurrency(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
}
function formatDate(d) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));
}

export default function TransactionsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState('SALE');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState({ open: false, transaction: null });
  const [business, setBusiness] = useState(null);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
      loadBusiness();
    }
  }, [status, tab]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?type=${tab}`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadBusiness() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setBusiness(data);
    } catch {}
  }

  async function viewDetail(id) {
    try {
      const res = await fetch(`/api/transactions/${id}`);
      const data = await res.json();
      setDetailModal({ open: true, transaction: data });
    } catch {}
  }

  return (
    <AppShell pageTitle="Transaksi">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transaksi</h1>
          <p className="page-subtitle">Riwayat penjualan dan pembelian</p>
        </div>
        <Link href="/transactions/new" className="btn btn-primary">
          <Plus size={16} /> Transaksi Baru
        </Link>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'SALE' ? 'active' : ''}`} onClick={() => setTab('SALE')}>Penjualan</button>
        <button className={`tab ${tab === 'PURCHASE' ? 'active' : ''}`} onClick={() => setTab('PURCHASE')}>Pembelian</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-container"><span className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No Invoice</th>
                  <th>Tanggal</th>
                  <th>{tab === 'SALE' ? 'Pelanggan' : 'Supplier'}</th>
                  <th>Subtotal</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <p className="empty-state-text">Belum ada transaksi</p>
                    </div>
                  </td></tr>
                ) : transactions.map(t => (
                  <tr key={t.id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--blue-400)' }}>{t.invoiceNo}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(t.date)}</td>
                    <td>{tab === 'SALE' ? (t.customer?.name || 'Walk-in') : (t.supplier?.name || '-')}</td>
                    <td>{formatCurrency(t.subtotal)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(t.total)}</td>
                    <td>
                      <span className={`badge ${t.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                        {t.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => viewDetail(t.id)} title="Detail"><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => generateInvoicePDF({ ...t, items: t.items || [] }, business)} title="Cetak"><Printer size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, transaction: null })}
        title={`Detail Transaksi — ${detailModal.transaction?.invoiceNo || ''}`}
        size="lg"
      >
        {detailModal.transaction && (
          <>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tanggal</p>
                  <p style={{ fontWeight: 500 }}>{formatDate(detailModal.transaction.date)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</p>
                  <span className={`badge ${detailModal.transaction.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                    {detailModal.transaction.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas'}
                  </span>
                </div>
                {detailModal.transaction.customer && (
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pelanggan</p>
                    <p style={{ fontWeight: 500 }}>{detailModal.transaction.customer.name}</p>
                  </div>
                )}
                {detailModal.transaction.supplier && (
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Supplier</p>
                    <p style={{ fontWeight: 500 }}>{detailModal.transaction.supplier.name}</p>
                  </div>
                )}
                {detailModal.transaction.paymentMethod && (
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Metode Pembayaran</p>
                    <p style={{ fontWeight: 500 }}>{detailModal.transaction.paymentMethod}</p>
                  </div>
                )}
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr>
                  </thead>
                  <tbody>
                    {(detailModal.transaction.items || []).map(item => (
                      <tr key={item.id}>
                        <td>{item.product?.name || '-'}</td>
                        <td>{item.qty} {item.product?.unit}</td>
                        <td>{formatCurrency(item.price)}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(detailModal.transaction.subtotal)}</span></div>
                {detailModal.transaction.discount > 0 && (
                  <div className="summary-row"><span>Diskon</span><span>- {formatCurrency(detailModal.transaction.discount)}</span></div>
                )}
                {detailModal.transaction.tax > 0 && (
                  <div className="summary-row"><span>Pajak</span><span>{formatCurrency(detailModal.transaction.tax)}</span></div>
                )}
                <div className="summary-row total"><span>Total</span><span>{formatCurrency(detailModal.transaction.total)}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetailModal({ open: false, transaction: null })}>Tutup</button>
              <button className="btn btn-primary" onClick={() => generateInvoicePDF(detailModal.transaction, business)}>
                <Printer size={14} /> Cetak Invoice
              </button>
            </div>
          </>
        )}
      </Modal>
    </AppShell>
  );
}
