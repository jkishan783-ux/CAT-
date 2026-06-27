import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'CAT_APP_JWT_TOKEN';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Persists the JWT token locally in AsyncStorage.
 */
export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

/**
 * Retrieves the stored JWT token.
 */
export async function getAuthToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

/**
 * Clears the stored JWT token (logout).
 */
export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/**
 * Helper to perform secure, authenticated HTTP requests.
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = await getAuthToken();
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Construct URL with query parameters if present
  let url = `${BASE_URL}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      searchParams.append(key, val);
    });
    url += `?${searchParams.toString()}`;
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! Status: ${response.status}`);
    }

    return data as T;
  } catch (error: any) {
    console.error(`API Request to ${endpoint} failed:`, error);
    throw error;
  }
}

// --- API Service Methods ---

export const authAPI = {
  login: async (email: string, password: string) => {
    const data = await request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await setAuthToken(data.token);
    return data;
  },

  signup: async (name: string, email: string, password: string) => {
    const data = await request<{ token: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    await setAuthToken(data.token);
    return data;
  },

  logout: async () => {
    await clearAuthToken();
  },
};

export const dashboardAPI = {
  /**
   * Pulls user streak status, today's daily test progress, and 6-hour interval test countdown details.
   * Uses local client YYYY-MM-DD date string.
   */
  fetchDashboardData: async (clientDateStr: string) => {
    // We execute parallel fetches for daily test status and interval test status
    const [dailyStatus, intervalStatus] = await Promise.all([
      request<any>('/tests/daily', { params: { date: clientDateStr } }),
      request<any>('/tests/interval'),
    ]);

    return {
      dailyStatus,     // contains: alreadyAttempted, score, testId, timeLimitMinutes, questions
      intervalStatus,  // contains: alreadyAttempted, windowKey, nextRefreshTime, startTime, endTime, questions
    };
  },
};

export const testAPI = {
  /**
   * Fetches mock test structure by mock ID.
   */
  fetchMockTest: async (mockId: string) => {
    return await request<any>(`/tests/mock/${mockId}`);
  },

  /**
   * Submits exam answers sheet to scoring engine.
   */
  submitAnswers: async (payload: {
    testType: 'mock' | 'sectional' | 'daily' | 'interval';
    testId: string;
    answers: Array<{ questionId: string; selectedAnswer: string; timeSpent: number }>;
    durationSpent: number;
    clientDateStr: string; // YYYY-MM-DD
  }) => {
    return await request<any>('/tests/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const leaderboardAPI = {
  fetchLeaderboard: async () => {
    return await request<any>('/leaderboard');
  },
};
