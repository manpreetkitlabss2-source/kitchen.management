import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import LoginPage from '../../../../client/app/components/auth/Login';

// Mock the loginUser service
jest.mock('../../../../client/services/axiosAuth', () => ({
  loginUser: jest.fn(),
}));

// Mock react-router navigation
const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

const { loginUser } = require('../../../../client/services/axiosAuth');

const renderLogin = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

describe('LoginPage component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/you@restaurant\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
  });

  it('renders Sign In button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation error when submitting empty form', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
    });
  });

  it('shows password error when only email is filled', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/you@restaurant\.com/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('calls loginUser and navigates on success', async () => {
    loginUser.mockResolvedValueOnce({ success: true });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/you@restaurant\.com/i), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith({ email: 'admin@test.com', password: 'password123' });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows server error on failed login', async () => {
    loginUser.mockRejectedValueOnce({
      response: { data: { error: 'Incorrect password. Please try again.' } },
    });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/you@restaurant\.com/i), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/incorrect password/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
