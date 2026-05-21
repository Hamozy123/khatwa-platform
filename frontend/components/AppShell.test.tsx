import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AppShell } from './AppShell';

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/dashboard',
    replace: jest.fn(),
  }),
}));

jest.mock('next/link', () => {
  return ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) =>
    React.createElement('a', { href, className }, children);
});

jest.mock('../lib/api', () => ({
  apiFetch: jest.fn().mockResolvedValue({ count: 3 }),
  clearToken: jest.fn(),
  getUser: jest.fn().mockReturnValue({ id: 1, username: 'admin', role: 'admin' }),
}));

describe('AppShell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render title', async () => {
    render(React.createElement(AppShell, { title: 'لوحة التحكم' }, React.createElement('div', null, 'محتوى')));
    await waitFor(() => {
      expect(screen.getAllByText('لوحة التحكم').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should render children', async () => {
    render(React.createElement(AppShell, { title: 'test' }, React.createElement('div', null, 'محتوى الاختبار')));
    await waitFor(() => {
      expect(screen.getByText('محتوى الاختبار')).toBeTruthy();
    });
  });

  it('should render all navigation items', async () => {
    render(React.createElement(AppShell, { title: 'test' }, React.createElement('div', null)));
    await waitFor(() => {
      expect(screen.getByText('لوحة التحكم')).toBeTruthy();
      expect(screen.getByText('سجل الطلاب')).toBeTruthy();
      expect(screen.getByText('خطة اليوم')).toBeTruthy();
      expect(screen.getByText('الإشعارات')).toBeTruthy();
      expect(screen.getByText('بنك الوسائل')).toBeTruthy();
      expect(screen.getByText('التقارير')).toBeTruthy();
      expect(screen.getByText('الإعدادات')).toBeTruthy();
      expect(screen.getByText('خروج')).toBeTruthy();
    });
  });

  it('should display brand name', async () => {
    render(React.createElement(AppShell, { title: 'test' }, React.createElement('div', null)));
    await waitFor(() => {
      expect(screen.getByText('خطوة')).toBeTruthy();
    });
  });

  it('should show user info when logged in', async () => {
    render(React.createElement(AppShell, { title: 'test' }, React.createElement('div', null)));
    await waitFor(() => {
      expect(screen.getByText('admin')).toBeTruthy();
    });
  });

  it('should show notification count badge', async () => {
    render(React.createElement(AppShell, { title: 'test' }, React.createElement('div', null)));
    await waitFor(() => {
      expect(screen.getByText('3')).toBeTruthy();
    });
  });

  it('should add active class to current nav link', async () => {
    render(React.createElement(AppShell, { title: 'test' }, React.createElement('div', null)));
    await waitFor(() => {
      const link = screen.getByText('لوحة التحكم').closest('a');
      expect(link?.className).toBe('active');
    });
  });
});
