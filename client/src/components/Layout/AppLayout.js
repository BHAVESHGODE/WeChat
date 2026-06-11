import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import useMediaQuery from '../../hooks/useMediaQuery';

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="app-main">
        {isMobile && (
          <MobileNav onMenuClick={() => setSidebarOpen(true)} />
        )}
        <div className="app-content-inner">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
