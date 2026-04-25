'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  Truck,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/products', icon: Package, label: 'Produk' },
  { href: '/transactions', icon: ShoppingCart, label: 'Transaksi' },
  { href: '/finances', icon: DollarSign, label: 'Keuangan' },
  { href: '/customers', icon: Users, label: 'Pelanggan' },
  { href: '/suppliers', icon: Truck, label: 'Supplier' },
  { href: '/reports', icon: BarChart2, label: 'Laporan' },
  { href: '/settings', icon: Settings, label: 'Pengaturan' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Store size={20} color="white" />
            </div>
            <span className="sidebar-logo-text">UMKM Admin</span>
          </div>
          <button className="sidebar-toggle" onClick={onToggle}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          <span className="nav-section-label">Menu</span>
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${pathname === href ? 'active' : ''}`}
            >
              <span className="nav-item-icon">
                <Icon size={20} />
              </span>
              <span className="nav-item-text">{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Bottom Nav for Mobile */}
      <nav className="bottom-nav">
        {navItems.slice(0, 5).map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`bottom-nav-item ${pathname === href ? 'active' : ''}`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
