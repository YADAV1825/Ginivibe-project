import React from 'react';
import Sidebar from '@/app/sidebar/components/Sidebar';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    // `light` pins the dashboard shell to the lime/champagne brand world,
    // even when the OS or a stored preference asks for dark. The shell
    // background is the landing gradient; the notch nav floats over it.
    <div className="layout-container light">
      <Sidebar />
      <main className="main-content">
        <div className="app-container">
          {children}
        </div>
      </main>
    </div>
  );
};
