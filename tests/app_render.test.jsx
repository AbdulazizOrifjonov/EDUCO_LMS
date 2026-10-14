import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import '@/i18n';

describe('App Rendering', () => {
  it('renders without crashing on /', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it('renders without crashing on /login', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it('renders without crashing on /owner/dashboard', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/owner/dashboard']}>
        <App />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });
});
