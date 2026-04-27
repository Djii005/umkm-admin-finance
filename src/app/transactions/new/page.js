'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppShell from '../../AppShell';
import Modal from '@/components/Modal';
import { Plus, Minus, ShoppingCart, Printer, CheckCircle, Package } from 'lucide-react';
import { generateInvoicePDF } from '@/components/InvoicePDF';

function formatCurrency(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
}

export default function NewTransactionPage() {
  const { status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [cart, setCart] = useState([]);
  const [type, setType] = useState('SALE');
  const [customerId, setCustomerId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successModal, setSuccessModal] = useState({ open: false, transaction: null });
  const [business, setBusiness] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/suppliers').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
      ]).then(([prods, custs, supps, biz]) => {
        setProducts(Array.isArray(prods) ? prods.filter(p => p.active) : []);
        setCustomers(Array.isArray(custs) ? custs : []);
        setSuppliers(Array.isArray(supps) ? supps : []);
        setBusiness(biz);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [status]);

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product) {
    if (type === 'SALE' && product.stock <= 0) return;
    const existing = cart.find(i => i.productId === product.id);
    if (existing) {
      setCart(cart.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      const price = type === 'SALE' ? product.sellPrice : product.buyPrice;
      setCart([...cart, { productId: product.id, name: product.name, price, qty: 1, unit: product.unit, stock: product.stock }]);
    }
  }

  function updateQty(productId, delta) {
    setCart(
      cart
        .map(i => i.productId === productId ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0)
    );
  }

  function removeFromCart(productId) {
    setCart(cart.filter(i => i.productId !== productId));
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const taxAmount = subtotal * (parseFloat(taxRate) / 100);
  const discountAmount = parseFloat(discount) || 0;
  const total = subtotal + taxAmount - discountAmount;

  async function handleCheckout() {
    if (cart.length === 0) { setError('Keranjang belanja kosong'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          customerId: customerId || null,
          supplierId: supplierId || null,
          items: cart.map(i => ({ productId: i.productId, qty: i.qty, price: i.price })),
          discount: discountAmount,
          tax: parseFloat(taxRate),
          paymentMethod,
          paymentStatus,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gagal membuat transaksi'); return; }
      setSuccessModal({ open: true, transaction: data });
      setCart([]);
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell pageTitle="Transaksi Baru">
        <div className="loading-container"><span className="spinner" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Transaksi Baru">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transaksi Baru</h1>
          <div className="tabs" style={{ marginBottom: 0, marginTop: 8 }}>
            <button className={`tab ${type === 'SALE' ? 'active' : ''}`} onClick={() => { setType('SALE'); setCart([]); }}>Penjualan</button>
            <button className={`tab ${type === 'PURCHASE' ? 'active' : ''}`} onClick={() => { setType('PURCHASE'); setCart([]); }}>Pembelian</button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="pos-layout">
        {/* Product Grid */}
        <div className="pos-products">
          <div style={{ marginBottom: 12 }}>
            <input className="form-control" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="pos-product-grid">
            {filteredProducts.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                Tidak ada produk ditemukan
              </div>
            ) : filteredProducts.map(p => (
              <div
                key={p.id}
                className={`pos-product-card ${type === 'SALE' && p.stock <= 0 ? 'out-of-stock' : ''}`}
                onClick={() => addToCart(p)}
              >
                <div style={{ marginBottom: 8 }}><Package size={28} color="var(--blue-400)" /></div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {formatCurrency(type === 'SALE' ? p.sellPrice : p.buyPrice)}
                </div>
                <span className={`badge ${p.stock <= p.minStock ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: 10 }}>
                  Stok: {p.stock}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="pos-cart">
          <div className="pos-cart-header">
            <ShoppingCart size={18} /> Keranjang ({cart.length})
          </div>
          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 16px', fontSize: 13 }}>
                Klik produk untuk menambahkan
              </div>
            ) : cart.map(item => (
              <div key={item.productId} className="pos-cart-item">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatCurrency(item.price)}</div>
                </div>
                <div className="cart-qty-control">
                  <button className="cart-qty-btn" onClick={() => updateQty(item.productId, -1)}>−</button>
                  <span style={{ fontSize: 14, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{item.qty}</span>
                  <button className="cart-qty-btn" onClick={() => updateQty(item.productId, 1)}>+</button>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, minWidth: 80, textAlign: 'right' }}>
                  {formatCurrency(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>
          <div className="pos-cart-footer">
            {type === 'SALE' ? (
              <div className="form-group">
                <label className="form-label">Pelanggan</label>
                <select className="form-control form-control-sm" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                  <option value="">Walk-in Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <select className="form-control form-control-sm" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                  <option value="">Pilih Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Diskon (Rp)</label>
                <input type="number" className="form-control form-control-sm" value={discount} onChange={e => setDiscount(e.target.value)} min="0" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Pajak (%)</label>
                <input type="number" className="form-control form-control-sm" value={taxRate} onChange={e => setTaxRate(e.target.value)} min="0" max="100" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Metode Pembayaran</label>
              <select className="form-control form-control-sm" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="Tunai">Tunai</option>
                <option value="Transfer">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
                <option value="Kartu">Kartu Debit/Kredit</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status Pembayaran</label>
              <select className="form-control form-control-sm" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                <option value="PAID">Lunas</option>
                <option value="UNPAID">Belum Lunas</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Catatan</label>
              <input type="text" className="form-control form-control-sm" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opsional..." />
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, marginBottom: 12 }}>
              <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              {discountAmount > 0 && (
                <div className="summary-row"><span>Diskon</span><span style={{ color: '#f87171' }}>- {formatCurrency(discountAmount)}</span></div>
              )}
              {taxAmount > 0 && (
                <div className="summary-row"><span>Pajak ({taxRate}%)</span><span>{formatCurrency(taxAmount)}</span></div>
              )}
              <div className="summary-row total"><span>TOTAL</span><span style={{ color: 'var(--blue-400)' }}>{formatCurrency(total)}</span></div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleCheckout}
              disabled={saving || cart.length === 0}
            >
              {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <CheckCircle size={16} />}
              {saving ? 'Memproses...' : 'Bayar'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={successModal.open}
        onClose={() => { setSuccessModal({ open: false, transaction: null }); router.push('/transactions'); }}
        title="Transaksi Berhasil"
      >
        {successModal.transaction && (
          <>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <CheckCircle size={48} color="var(--success)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Transaksi Berhasil!</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
                No Invoice: <strong style={{ color: 'var(--blue-400)' }}>{successModal.transaction.invoiceNo}</strong>
              </p>
              <p style={{ fontSize: 18, fontWeight: 700 }}>{formatCurrency(successModal.transaction.total)}</p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => { setSuccessModal({ open: false, transaction: null }); router.push('/transactions'); }}>
                Selesai
              </button>
              <button className="btn btn-primary" onClick={() => generateInvoicePDF(successModal.transaction, business)}>
                <Printer size={14} /> Cetak Invoice
              </button>
            </div>
          </>
        )}
      </Modal>
    </AppShell>
  );
}
