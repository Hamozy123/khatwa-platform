import { getApiBase, getToken, setToken, clearToken, setUser, getUser } from './api';

describe('api utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getApiBase', () => {
    it('should return URL with default port', () => {
      const url = getApiBase();
      expect(url).toContain('/api');
    });
  });

  describe('token management', () => {
    it('should store and retrieve token', () => {
      setToken('test-token');
      expect(getToken()).toBe('test-token');
    });

    it('should clear token', () => {
      setToken('test-token');
      clearToken();
      expect(getToken()).toBeNull();
    });

    it('should return null when no token', () => {
      expect(getToken()).toBeNull();
    });
  });

  describe('user management', () => {
    it('should store and retrieve user', () => {
      const user = { id: 1, username: 'admin', role: 'admin' };
      setUser(user);
      expect(getUser()).toEqual(user);
    });

    it('should return null when no user', () => {
      expect(getUser()).toBeNull();
    });

    it('should clear user on clearToken', () => {
      setUser({ id: 1, username: 'admin', role: 'admin' });
      clearToken();
      expect(getUser()).toBeNull();
    });
  });
});
