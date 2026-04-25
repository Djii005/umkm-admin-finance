'use client';
import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function Navbar({ collapsed, pageTitle }) {
  const { data: session } = useSession();
  const initials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className={`navbar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="navbar-left">
        <span className="navbar-page-title">{pageTitle || 'Dashboard'}</span>
      </div>
      <div className="navbar-right">
        <div className="navbar-user">
          <div className="navbar-avatar">{initials}</div>
          <span className="navbar-username">{session?.user?.name || 'User'}</span>
        </div>
        <button
          className="btn-logout"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut size={15} />
          Keluar
        </button>
      </div>
    </header>
  );
}
