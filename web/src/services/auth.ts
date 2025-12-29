import Cookies from 'js-cookie';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_EMAIL_KEY = 'user_email';

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const saveAuthData = (tokens: AuthTokens, email: string): void => {
  Cookies.set(ACCESS_TOKEN_KEY, tokens.access, {
    expires: 1,
    secure: true,
    sameSite: 'strict'
  });
  Cookies.set(REFRESH_TOKEN_KEY, tokens.refresh, {
    expires: 7,
    secure: true,
    sameSite: 'strict'
  });

  localStorage.setItem(USER_EMAIL_KEY, email);
};

export const getAuthTokens = (): AuthTokens | null => {
  const accessToken = Cookies.get(ACCESS_TOKEN_KEY);
  const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);

  if (accessToken && refreshToken) {
    return {
      access: accessToken,
      refresh: refreshToken
    };
  }

  return null;
};

export const getUserEmail = (): string | null => {
  return localStorage.getItem(USER_EMAIL_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getAuthTokens();
};

export const clearAuthData = (): void => {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
};

export const updateAccessToken = (newAccessToken: string): void => {
  Cookies.set(ACCESS_TOKEN_KEY, newAccessToken, {
    expires: 1,
    secure: true,
    sameSite: 'strict'
  });
};