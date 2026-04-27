'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function AppShell({ children, pageTitle }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar collapsed={collapsed} pageTitle={pageTitle} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
