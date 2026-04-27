'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppShell from './AppShell';
import StatCard from '@/components/StatCard';
import { SalesAreaChart } from '@/components/Chart';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, chartRes, topRes, transRes, productsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/charts'),
        fetch('/api/dashboard/top-products'),
        fetch('/api/transactions?type=SALE'),
        fetch('/api/products'),
      ]);
      const [statsData, chartData, topData, transData, productsData] = await Promise.all([
        statsRes.json(), chartRes.json(), topRes.json(), transRes.json(), productsRes.json(),
      ]);
      setStats(statsData);
      setChartData(chartData);
      setTopProducts(topData);
      setRecentTransactions(Array.isArray(transData) ? transData.slice(0, 5) : []);
      const low = Array.isArray(productsData) ? productsData.filter(p => p.stock <= p.minStock && p.active) : [];
      setLowStock(low);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <AppShell pageTitle="Dashboard">
        <div className="loading-container"><span className="spinner" /><span>Memuat data...</span></div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Dashboard">
      {lowStock.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} />
          <span><strong>{lowStock.length} produk</strong> memiliki stok rendah: {lowStock.slice(0, 3).map(p => p.name).join(', ')}{lowStock.length > 3 ? ` +${lowStock.length - 3} lainnya` : ''}</span>
        </div>
      )}

      <div className="stat-grid">
        <StatCard title="Penjualan Hari Ini" value={formatCurrency(stats?.salesToday)} icon={<ShoppingCart size={18} />} iconColor="blue" />
        <StatCard title="Total Pendapatan" value={formatCurrency(stats?.totalIncome)} icon={<TrendingUp size={18} />} iconColor="green" />
        <StatCard title="Total Pengeluaran" value={formatCurrency(stats?.totalExpense)} icon={<TrendingDown size={18} />} iconColor="red" />
        <StatCard title="Laba Bersih" value={formatCurrency(stats?.profit)} icon={<DollarSign size={18} />} iconColor={stats?.profit >= 0 ? 'green' : 'red'} />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3 className="card-title">Tren Penjualan &amp; Pengeluaran</h3>
          <SalesAreaChart data={chartData} />
        </div>
        <div className="card">
          <h3 className="card-title">5 Produk Terlaris</h3>
          <div className="recent-list">
            {topProducts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Belum ada data penjualan</p>
            ) : topProducts.map((p, i) => (
              <div key={p.id} className="recent-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 24, height: 24, background: 'var(--bg-tertiary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--blue-400)' }}>{i + 1}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.unit}</div>
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue-400)' }}>{p.totalQty} terjual</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="card-title" style={{ marginBottom: 0 }}>Transaksi Terbaru</h3>
          <a href="/transactions" style={{ fontSize: 13, color: 'var(--blue-400)' }}>Lihat Semua →</a>
        </div>
        {recentTransactions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Belum ada transaksi</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No Invoice</th>
                  <th>Tanggal</th>
                  <th>Pelanggan</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(t => (
                  <tr key={t.id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--blue-400)' }}>{t.invoiceNo}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(t.date)}</td>
                    <td>{t.customer?.name || 'Walk-in'}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(t.total)}</td>
                    <td><span className={`badge ${t.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>{t.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
