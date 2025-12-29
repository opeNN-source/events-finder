import axios from "axios";
import useSWR from "swr";
import type {Config} from "../utils.ts";
import {clearAuthData, getAuthTokens, getUserEmail, updateAccessToken} from "./auth";
import Cookies from "js-cookie";

const baseURL: string = import.meta.env.VITE_BACK_URL;

const instance = axios.create({
  baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  (config) => {
    const tokens = getAuthTokens();
    if (tokens?.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = getAuthTokens();
        if (tokens?.refresh) {
          const response = await axios.post(`${baseURL}/auth/refresh`, {
            refresh: tokens.refresh
          });

          const newTokens = response.data;
          updateAccessToken(newTokens.access);

          if (newTokens.refresh) {
            Cookies.set('refresh_token', newTokens.refresh, {
              expires: 7,
              secure: true,
              sameSite: 'strict'
            });
          }

          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
          return instance(originalRequest);
        }
      } catch (refreshError) {
        clearAuthData();
        window.location.href = '/web';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const fetcher = (url: string) => {
  return instance.get(url).then(res => res.data);
};

export const authAPI = {
  signup: (data: { email: string; password: string;}) => {
    return instance.post('/auth/signup', data);
  },

  login: (credentials: { email: string; password: string }) => {
    return instance.post('/auth/login', credentials);
  },

  refreshToken: (refreshToken: string) => {
    return instance.post('/auth/refresh', { refresh: refreshToken });
  },

  logout: (refreshToken: string) => {
    return instance.post('/auth/logout', { refresh: refreshToken });
  }
};

export interface SearchParams {
  category?: string[];
  region?: string[];
  format?: string[];
  date_start?: string;
  date_end?: string;
  price_min?: number;
  price_max?: number;
  query?: string;
  name?: string;
}

export const useEvents = (params?: SearchParams) => {
  const queryString = new URLSearchParams();

  if (params?.name) {
    queryString.append('name', params.name);
  }
  if (params?.category) {
    params.category.forEach(cat => queryString.append('category', cat));
  }
  if (params?.region) {
    params.region.forEach(reg => queryString.append('region', reg));
  }
  if (params?.format) {
    params.format.forEach(fmt => queryString.append('format', fmt));
  }
  if (params?.date_start) {
    queryString.append('date_start', params.date_start);
  }
  if (params?.date_end) {
    queryString.append('date_end', params.date_end);
  }
  if (params?.price_min !== undefined) {
    queryString.append('price_min', params.price_min.toString());
  }
  if (params?.price_max !== undefined) {
    queryString.append('price_max', params.price_max.toString());
  }
  if (params?.query) {
    queryString.append('query', params.query);
  }

  const url = `/api/search${queryString.toString() ? `?${queryString.toString()}` : ''}`;

  return useSWR(url, fetcher);
};

export const useConfig = () => {
  return useSWR('/api/agent/config', fetcher);
};

export const createConfig = (cfg: Config) => {
  return instance.post('/api/agent/config', cfg);
};

export const sendEmail = (eids: number[]) => {
  const emailToSend = getUserEmail();

  if (!emailToSend) {
    console.error('No email found for sending');
    throw new Error('Email is required for sending');
  }

  return instance.post('/email/event-registration', {
    email: emailToSend,
    event_ids: eids
  });
};