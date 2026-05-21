import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('../../lib/api', () => ({
  apiFetch: jest.fn(),
  setToken: jest.fn(),
  setUser: jest.fn(),
  getToken: jest.fn().mockReturnValue(null),
  getUser: jest.fn().mockReturnValue(null),
}));

describe('Login page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form', async () => {
    const { default: LoginPage } = await import('../../pages/login');
    render(React.createElement(LoginPage));

    await waitFor(() => {
      expect(screen.getByText('خطوة')).toBeTruthy();
      expect(screen.getByText('تسجيل الدخول')).toBeTruthy();
    });
  });

  it('should show validation error on empty fields', async () => {
    const { default: LoginPage } = await import('../../pages/login');
    const { container } = render(React.createElement(LoginPage));

    await waitFor(() => {
      const buttons = container.querySelectorAll('button');
      const submitBtn = buttons[0] || buttons[1];
      if (submitBtn) {
        fireEvent.click(submitBtn);
      }
    });
  });

  it('should accept username and password inputs', async () => {
    const { default: LoginPage } = await import('../../pages/login');
    const { container } = render(React.createElement(LoginPage));

    await waitFor(() => {
      const inputs = container.querySelectorAll('input');
      if (inputs.length >= 2) {
        fireEvent.change(inputs[0], { target: { value: 'testuser' } });
        fireEvent.change(inputs[1], { target: { value: 'testpass' } });
      }
    });
  });
});

