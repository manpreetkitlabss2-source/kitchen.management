import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import LoginPage from '@client/app/components/auth/Login';

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('@client/services/axiosAuth', () => ({ loginUser: jest.fn() }));

const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

const { loginUser } = require('@client/services/axiosAuth');

// ── Helpers ───────────────────────────────────────────────────────────────────
const renderLogin = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

const fillForm = async (email, password) => {
  await userEvent.type(screen.getByPlaceholderText(/you@restaurant\.com/i), email);
  await userEvent.type(screen.getByPlaceholderText(/••••••••/i), password);
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('LoginPage component', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Rendering ───────────────────────────────────────────────────────────────
  describe('Rendering', () => {
    it('renders email field, password field, and Sign In button', () => {
      renderLogin();
      expect(screen.getByPlaceholderText(/you@restaurant\.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders a link to the signup page', () => {
      renderLogin();
      expect(screen.getByRole('link', { name: /create admin account/i })).toBeInTheDocument();
    });

    it('password field is hidden by default', () => {
      renderLogin();
      expect(screen.getByPlaceholderText(/••••••••/i)).toHaveAttribute('type', 'password');
    });
  });

  // ── Validation ───────────────────────────────────────────────────────────────
  describe('Client-side validation', () => {
    it('shows email required error on empty submit', async () => {
      renderLogin();
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      await waitFor(() =>
        expect(screen.getByText(/email address is required/i)).toBeInTheDocument()
      );
    });

    it('shows password required error when only email is filled', async () => {
      renderLogin();
      await userEvent.type(screen.getByPlaceholderText(/you@restaurant\.com/i), 'test@test.com');
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      await waitFor(() =>
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      );
    });

    it('clears field error when user starts typing', async () => {
      renderLogin();
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      await waitFor(() =>
        expect(screen.getByText(/email address is required/i)).toBeInTheDocument()
      );
      await userEvent.type(screen.getByPlaceholderText(/you@restaurant\.com/i), 'a');
      await waitFor(() =>
        expect(screen.queryByText(/email address is required/i)).not.toBeInTheDocument()
      );
    });
  });

  // ── Password toggle ──────────────────────────────────────────────────────────
  describe('Password visibility toggle', () => {
    it('toggles password field to text and back', async () => {
      renderLogin();
      const input = screen.getByPlaceholderText(/••••••••/i);
      const toggle = screen.getAllByRole('button').find(b => b.getAttribute('tabindex') === '-1');

      expect(input).toHaveAttribute('type', 'password');
      fireEvent.click(toggle);
      expect(input).toHaveAttribute('type', 'text');
      fireEvent.click(toggle);
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  // ── Successful login ─────────────────────────────────────────────────────────
  describe('Successful login', () => {
    it('calls loginUser with correct credentials and navigates to /', async () => {
      loginUser.mockResolvedValueOnce({ success: true });
      renderLogin();
      await fillForm('admin@test.com', 'password123');
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(loginUser).toHaveBeenCalledWith({
          email   : 'admin@test.com',
          password: 'password123',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  // ── Failed login ─────────────────────────────────────────────────────────────
  describe('Failed login', () => {
    it('shows password field error for incorrect password response', async () => {
      loginUser.mockRejectedValueOnce({
        response: { data: { error: 'Incorrect password. Please try again.' } },
      });
      renderLogin();
      await fillForm('admin@test.com', 'wrongpass');
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() =>
        expect(screen.getByText(/incorrect password/i)).toBeInTheDocument()
      );
    });

    it('shows email field error for unknown account response', async () => {
      loginUser.mockRejectedValueOnce({
        response: { data: { error: 'No account found with that email address.' } },
      });
      renderLogin();
      await fillForm('nobody@test.com', 'pass');
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() =>
        expect(screen.getByText(/no account found/i)).toBeInTheDocument()
      );
    });

    it('shows generic server error banner for unknown errors', async () => {
      loginUser.mockRejectedValueOnce({
        response: { data: { error: 'Something went wrong. Please try again.' } },
      });
      renderLogin();
      await fillForm('admin@test.com', 'pass');
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() =>
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      );
    });
  });
});
