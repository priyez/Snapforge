import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Set the API key or JWT for all requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('snapforge_auth_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('snapforge_auth_token');
  }
};

// Initialize from local storage
const savedToken = localStorage.getItem('snapforge_auth_token');
if (savedToken) setAuthToken(savedToken);

// ── Types ───────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ScreenshotJob {
  id: string;
  url: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  imageUrl?: string;
  renderTimeMs?: number;
  errorMessage?: string;
  diffPercentage?: number;
  diffImageUrl?: string;
  baselineId?: string;
  createdAt: string;
}

export interface Schedule {
  id: string;
  name: string;
  url: string;
  cron: string;
  active: boolean;
  options: any;
  lastRunAt: string | null;
  createdAt: string;
}

export interface Webhook {
  id: string;
  url: string;
  name: string | null;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: string;
  _count?: {
    logs: number;
  };
}

export interface WebhookLog {
  id: string;
  event: string;
  statusCode: number | null;
  success: boolean;
  durationMs: number;
  createdAt: string;
}

// ── Auth Hooks ──────────────────────────────────────────────────

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await api.post('/api/auth/login', credentials);
      setAuthToken(data.data.token);
      return data.data;
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: any) => {
      const { data } = await api.post('/api/auth/register', userData);
      setAuthToken(data.data.token);
      return data.data;
    },
  });
};

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/api/auth/me');
      return data.data;
    },
    enabled: !!localStorage.getItem('snapforge_auth_token'),
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: any) => {
      const { data } = await api.patch('/api/auth/settings', settings);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

// ── Hooks ───────────────────────────────────────────────────────

export const useApiKeys = () => {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data } = await api.get('/api/keys');
      return data.data as ApiKey[];
    },
  });
};

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post('/api/keys', { name });
      return data.data as { rawKey: string; apiKey: ApiKey };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
};

export const useRevokeApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
};

export const useSchedules = () => {
  return useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const { data } = await api.get('/api/screenshot/schedules');
      return data.data as Schedule[];
    },
  });
};

export const useSchedule = (id: string) => {
  return useQuery({
    queryKey: ['schedule', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/screenshot/schedules/${id}`);
      return data.data as Schedule;
    },
    enabled: !!id,
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...params }: { id: string } & Partial<Schedule>) => {
      const { data } = await api.patch(`/api/screenshot/schedules/${id}`, params);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', variables.id] });
    },
  });
};

export const useScheduleHistory = (id: string) => {
  return useQuery({
    queryKey: ['schedule-history', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/screenshot/schedules/${id}/history`);
      return data.data as ScreenshotJob[];
    },
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: any) => {
      const { data } = await api.post('/api/screenshot/schedules', params);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/screenshot/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

export const useWebhooks = () => {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data } = await api.get('/api/webhooks');
      return data.data as Webhook[];
    },
  });
};

export const useCreateWebhook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: any) => {
      const { data } = await api.post('/api/webhooks', params);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });
};

export const useDeleteWebhook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });
};

export const useWebhookLogs = (id: string) => {
  return useQuery({
    queryKey: ['webhook-logs', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/webhooks/${id}/logs`);
      return data.data as WebhookLog[];
    },
    enabled: !!id,
  });
};

export const useScreenshotHistory = () => {
  return useQuery({
    queryKey: ['screenshot-history'],
    queryFn: async () => {
      const { data } = await api.get('/api/screenshot/history');
      return data.data as ScreenshotJob[];
    },
  });
};

export const useTakeScreenshot = () => {
  return useMutation({
    mutationFn: async (params: any) => {
      const { data } = await api.post('/api/screenshot', params);
      return data.data;
    },
  });
};
