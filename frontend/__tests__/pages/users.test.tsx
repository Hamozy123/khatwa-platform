import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/users',
  }),
}));

jest.mock('next/link', () => {
  return ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) =>
    React.createElement('a', { href, className }, children);
});

const mockApiFetch = jest.fn();
jest.mock('../../lib/api', () => ({
  apiFetch: (...args: any[]) => mockApiFetch(...args),
  getToken: jest.fn(),
  getUser: jest.fn(),
}));

import { getToken, getUser } from '../../lib/api';

const sampleUsers = [
  { id: 1, username: 'admin', role: 'admin', governorate: 'القاهرة', directorate: 'مديرية القاهرة الجديدة', administration: 'إدارة التجمع الأول', schoolName: 'مدرسة التجمع الأول' },
  { id: 2, username: 'teacher1', role: 'teacher_m', governorate: 'الجيزة', directorate: 'مديرية الجيزة', administration: 'إدارة الدقي', schoolName: '' },
];

describe('UsersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getToken as jest.Mock).mockReturnValue('valid-token');
    (getUser as jest.Mock).mockReturnValue({ id: 1, username: 'admin', role: 'admin' });
    mockApiFetch.mockImplementation((path: string) => {
      if (path === '/auth/users') return Promise.resolve(sampleUsers);
      if (path.includes('/locations?type=governorate')) return Promise.resolve([{ id: 1, type: 'governorate', name: 'القاهرة', parentId: null }, { id: 2, type: 'governorate', name: 'الجيزة', parentId: null }]);
      if (path.includes('/locations?type=directorate')) return Promise.resolve([{ id: 3, type: 'directorate', name: 'مديرية القاهرة الجديدة', parentId: 1 }]);
      if (path.includes('/locations?type=administration')) return Promise.resolve([{ id: 5, type: 'administration', name: 'إدارة التجمع الأول', parentId: 3 }]);
      return Promise.resolve([]);
    });
  });

  it('should redirect to login when no token', async () => {
    (getToken as jest.Mock).mockReturnValue(null);
    const { default: UsersPage } = await import('../../pages/users');
    const { container } = render(React.createElement(UsersPage));
    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('should render nothing for non-admin users', async () => {
    (getUser as jest.Mock).mockReturnValue({ id: 2, username: 'teacher', role: 'teacher_m' });
    const { default: UsersPage } = await import('../../pages/users');
    const { container } = render(React.createElement(UsersPage));
    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('should load and display users table', async () => {
    const { default: UsersPage } = await import('../../pages/users');
    render(React.createElement(UsersPage));
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/auth/users');
    });
    await waitFor(() => {
      const admins = screen.getAllByText('admin');
      expect(admins.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('teacher1')).toBeTruthy();
      expect(screen.getByText('مسؤول النظام')).toBeTruthy();
      expect(screen.getByText('معلم')).toBeTruthy();
    });
  });

  it('should toggle add user form', async () => {
    const { default: UsersPage } = await import('../../pages/users');
    render(React.createElement(UsersPage));
    await waitFor(() => expect(screen.getByText('إضافة مستخدم')).toBeTruthy());
    expect(screen.queryByText('إضافة مستخدم جديد')).toBeNull();
    fireEvent.click(screen.getByText('إضافة مستخدم'));
    await waitFor(() => expect(screen.getByText('إضافة مستخدم جديد')).toBeTruthy());
    const cancelButtons = screen.getAllByText('إلغاء');
    fireEvent.click(cancelButtons[0]);
    await waitFor(() => expect(screen.queryByText('إضافة مستخدم جديد')).toBeNull());
  });

  it('should open edit form with user data', async () => {
    const { default: UsersPage } = await import('../../pages/users');
    render(React.createElement(UsersPage));
    await waitFor(() => expect(screen.getByText('teacher1')).toBeTruthy());
    const editButtons = screen.getAllByText('تعديل');
    fireEvent.click(editButtons[0]);
    await waitFor(() => expect(screen.getByText('تعديل مستخدم')).toBeTruthy());
  });

  it('should show delete confirmation modal', async () => {
    const { default: UsersPage } = await import('../../pages/users');
    render(React.createElement(UsersPage));
    await waitFor(() => expect(screen.getByText('teacher1')).toBeTruthy());
    const deleteButtons = screen.getAllByText('حذف');
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('تأكيد الحذف')).toBeTruthy();
      expect(screen.getByText('هل أنت متأكد من حذف هذا المستخدم؟')).toBeTruthy();
    });
  });

  it('should show reset password modal', async () => {
    const { default: UsersPage } = await import('../../pages/users');
    render(React.createElement(UsersPage));
    await waitFor(() => expect(screen.getByText('teacher1')).toBeTruthy());
    const pwButtons = screen.getAllByText('كلمة المرور');
    fireEvent.click(pwButtons[0]);
    await waitFor(() => expect(screen.getByText('إعادة تعيين كلمة المرور')).toBeTruthy());
  });

  it('should create a new user via API', async () => {
    const createMock = jest.fn().mockResolvedValue({ id: 3 });
    mockApiFetch.mockImplementation((path: string, opts?: any) => {
      if (path === '/auth/users' && opts?.method === 'POST') return createMock();
      if (path === '/auth/users') return Promise.resolve(sampleUsers);
      if (path.includes('/locations')) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    const { default: UsersPage } = await import('../../pages/users');
    const { container } = render(React.createElement(UsersPage));
    await waitFor(() => expect(screen.getByText('إضافة مستخدم')).toBeTruthy());
    fireEvent.click(screen.getByText('إضافة مستخدم'));
    await waitFor(() => expect(screen.getByText('إضافة مستخدم جديد')).toBeTruthy());
    const inputs = container.querySelectorAll('form input');
    fireEvent.change(inputs[0], { target: { value: 'newuser' } });
    const addBtn = screen.getByText('إضافة');
    fireEvent.click(addBtn);
    await waitFor(() => {
      expect(createMock).toHaveBeenCalled();
    });
  });

  it('should delete a user via API', async () => {
    mockApiFetch.mockImplementation((path: string, opts?: any) => {
      if (path === '/auth/users/2' && opts?.method === 'DELETE') return Promise.resolve({});
      if (path === '/auth/users') return Promise.resolve(sampleUsers);
      if (path.includes('/locations')) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    const { default: UsersPage } = await import('../../pages/users');
    render(React.createElement(UsersPage));
    await waitFor(() => expect(screen.getByText('teacher1')).toBeTruthy());
    const deleteButtons = screen.getAllByText('حذف');
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);
    await waitFor(() => expect(screen.getByText('تأكيد الحذف')).toBeTruthy());
    fireEvent.click(screen.getByText('تأكيد'));
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/auth/users/2', expect.objectContaining({ method: 'DELETE' }));
    });
  });

  it('should reset password via API', async () => {
    mockApiFetch.mockImplementation((path: string, opts?: any) => {
      if (path === '/auth/users/2/reset-password' && opts?.method === 'POST') return Promise.resolve({});
      if (path === '/auth/users') return Promise.resolve(sampleUsers);
      if (path.includes('/locations')) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    const { default: UsersPage } = await import('../../pages/users');
    render(React.createElement(UsersPage));
    await waitFor(() => expect(screen.getByText('teacher1')).toBeTruthy());
    const pwButtons = screen.getAllByText('كلمة المرور');
    fireEvent.click(pwButtons[pwButtons.length - 1]);
    await waitFor(() => expect(screen.getByText('إعادة تعيين كلمة المرور')).toBeTruthy());
    const input = screen.getByPlaceholderText('كلمة المرور الجديدة');
    fireEvent.change(input, { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByText('حفظ'));
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/auth/users/2/reset-password', expect.objectContaining({ method: 'POST' }));
    });
  });

  it('should allow admin_manager role to access page', async () => {
    (getUser as jest.Mock).mockReturnValue({ id: 3, username: 'manager', role: 'admin_manager' });
    const { default: UsersPage } = await import('../../pages/users');
    render(React.createElement(UsersPage));
    await waitFor(() => expect(screen.getByText('إضافة مستخدم')).toBeTruthy());
  });

  it('should display error when API fails on load', async () => {
    mockApiFetch.mockRejectedValue(new Error('فشل تحميل البيانات'));
    const { default: UsersPage } = await import('../../pages/users');
    render(React.createElement(UsersPage));
    await waitFor(() => expect(screen.getByText('فشل تحميل البيانات')).toBeTruthy());
  });
});
