'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError('Email atau password salah');
    } else {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Store size={24} color="white" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700 }}>UMKM Admin</span>
        </div>
        <h1 className="auth-title">Masuk ke Akun</h1>
        <p className="auth-subtitle">Kelola bisnis Anda dengan mudah</p>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="owner@umkm.test"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? <span className="spinner" /> : <LogIn size={16} />}
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="auth-link">
          Belum punya akun? <Link href="/register">Daftar sekarang</Link>
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
          Demo: owner@umkm.test / password123
        </p>
      </div>
    </div>
  );
}
