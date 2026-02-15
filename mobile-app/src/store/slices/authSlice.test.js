import authReducer, {
  loginSuccess,
  loginFailure,
  logout,
  setLoading,
} from '../slices/authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(authReducer(undefined, {})).toEqual(initialState);
  });

  it('should handle loginSuccess', () => {
    const user = { id: 'user-123', email: 'test@example.com' };
    const accessToken = 'access-token';
    const refreshToken = 'refresh-token';

    const state = authReducer(
      initialState,
      loginSuccess({ user, accessToken, refreshToken })
    );

    expect(state.user).toEqual(user);
    expect(state.accessToken).toEqual(accessToken);
    expect(state.refreshToken).toEqual(refreshToken);
    expect(state.isAuthenticated).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle loginFailure', () => {
    const error = 'Invalid credentials';

    const state = authReducer(initialState, loginFailure(error));

    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toEqual(error);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('should handle logout', () => {
    const stateWithAuth = {
      ...initialState,
      user: { id: 'user-123' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      isAuthenticated: true,
    };

    const state = authReducer(stateWithAuth, logout());

    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should handle setLoading', () => {
    const state = authReducer(initialState, setLoading(true));
    expect(state.loading).toBe(true);
  });
});
