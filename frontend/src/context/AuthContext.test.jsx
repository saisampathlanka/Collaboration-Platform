import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import * as api from '../services/api';

vi.mock('../services/api');

function TestComponent() {
  const { user, loading } = useAuth();
  if (loading) return <div data-testid="loading">Loading...</div>;
  if (!user) return <div data-testid="not-logged-in">Not logged in</div>;
  return <div data-testid="logged-in">Logged in as {user.email}</div>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.setToken(null);
  });

  it('shows not logged in when no token', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('not-logged-in')).toBeInTheDocument();
  });

  it('restores session when token exists in localStorage', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    localStorage.setItem('token', 'valid-token');
    api.getMe.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('logged-in')).toHaveTextContent('Logged in as test@example.com');
    });
    expect(api.setToken).toHaveBeenCalledWith('valid-token');
  });

  it('clears invalid token from localStorage', async () => {
    localStorage.setItem('token', 'invalid-token');
    api.getMe.mockRejectedValue(new Error('Invalid token'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('not-logged-in')).toBeInTheDocument();
    });
    expect(localStorage.getItem('token')).toBeNull();
  });
});
