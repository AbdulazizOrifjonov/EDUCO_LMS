import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '@/layouts/Sidebar';
import ScrollToTop from '@/components/ScrollToTop';
import '@/i18n';

describe('Sidebar Scroll Preservation', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('ScrollToTop resets page content but preserves sidebar and aside scroll position', () => {
    // Set up DOM with main container, general overflow-y-auto, and sidebar nav
    document.body.innerHTML = `
      <div id="root">
        <aside>
          <nav class="sidebar-scroll overflow-y-auto" data-preserve-scroll="true" style="height: 200px;"></nav>
        </aside>
        <main class="overflow-y-auto" style="height: 500px;"></main>
        <div class="overflow-y-auto other-page-container" style="height: 400px;"></div>
      </div>
    `;

    const sidebarNav = document.querySelector('nav.sidebar-scroll');
    const mainContainer = document.querySelector('main');
    const otherContainer = document.querySelector('.other-page-container');

    sidebarNav.scrollTop = 380;
    mainContainer.scrollTop = 450;
    otherContainer.scrollTop = 250;

    // Render ScrollToTop component
    render(
      <MemoryRouter initialEntries={['/owner/dashboard', '/owner/website']}>
        <ScrollToTop />
      </MemoryRouter>
    );

    // Sidebar MUST NOT be reset to 0!
    expect(sidebarNav.scrollTop).toBe(380);

    // Page content containers MUST be reset to 0
    expect(mainContainer.scrollTop).toBe(0);
    expect(otherContainer.scrollTop).toBe(0);
  });

  it('Sidebar saves scroll position to sessionStorage on scroll and restores it', async () => {
    const mockItems = [
      { label: 'Dashboard', path: '/owner/dashboard' },
      { label: 'Users', path: '/owner/users' },
      { label: 'Courses', path: '/owner/courses' },
      { label: 'Groups', path: '/owner/groups' },
      { label: 'Website', path: '/owner/website' },
      { label: 'Settings', path: '/owner/settings' },
    ];

    const { container } = render(
      <MemoryRouter initialEntries={['/owner/website']}>
        <Sidebar items={mockItems} role="owner" />
      </MemoryRouter>
    );

    const nav = container.querySelector('nav.sidebar-scroll');
    expect(nav).toBeTruthy();

    // Simulate user scrolling sidebar
    Object.defineProperty(nav, 'scrollTop', {
      value: 420,
      writable: true,
    });

    fireEvent.scroll(nav);

    // Verify sessionStorage has saved the position
    expect(sessionStorage.getItem('educo_sidebar_scroll_owner')).toBe('420');
  });
});
