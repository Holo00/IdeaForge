import { Idea, GenerationResult } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Get the auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Get auth headers if token exists
 */
function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    console.log('[API] Request:', url);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const data: ApiResponse<T> = await response.json();

    console.log('[API] Response:', { success: data.success, hasData: !!data.data });

    if (!data.success || !response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data.data as T;
  }

  // Ideas endpoints
  async getIdeas(params?: {
    status?: string;
    domain?: string;
    subdomain?: string;
    minScore?: number;
    maxScore?: number;
    tags?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    // Advanced filters
    search?: string;
    framework?: string;
    monetization?: string;
    targetAudience?: string;
    technology?: string;
    maxTeamSize?: number;
    minCriteriaScores?: Record<string, number>;
  }): Promise<{ ideas: Idea[]; total: number }> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'minCriteriaScores' && typeof value === 'object') {
            // Serialize criteria scores as JSON string
            queryParams.append(key, JSON.stringify(value));
          } else if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }

    const query = queryParams.toString();
    return this.request(`/ideas${query ? `?${query}` : ''}`);
  }

  async getIdea(id: string): Promise<Idea> {
    return this.request(`/ideas/${id}`);
  }

  async updateIdea(id: string, updates: Partial<Idea>): Promise<Idea> {
    return this.request(`/ideas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteIdea(id: string): Promise<void> {
    return this.request(`/ideas/${id}`, {
      method: 'DELETE',
    });
  }

  // Generation endpoints
  async generateIdea(options?: {
    framework?: string;
    domain?: string;
    skipDuplicateCheck?: boolean;
    sessionId?: string;
    profileId?: string;
    slotNumber?: number;
  }): Promise<GenerationResult> {
    return this.request('/generate', {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  // Get active generation session for a specific slot
  async getSlotActiveSession(slotNumber: number): Promise<{
    session_id: string;
    status: string;
    current_stage: string;
    slot_number: number;
    started_at: string;
    updated_at: string;
  } | null> {
    const response = await this.request<any>(`/logs/slot/${slotNumber}/active`);
    return response;
  }


  // Config endpoints (these return raw data, not wrapped in ApiResponse)
  private async rawRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Request failed');
    }

    return response.json();
  }

  async getFrameworks(profileId?: string): Promise<any> {
    const url = profileId ? `/config/frameworks?profileId=${profileId}` : '/config/frameworks';
    return this.rawRequest(url);
  }

  async updateFrameworks(data: any, profileId?: string): Promise<void> {
    const url = profileId ? `/config/frameworks?profileId=${profileId}` : '/config/frameworks';
    return this.rawRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getDomains(profileId?: string): Promise<any> {
    const url = profileId ? `/config/domains?profileId=${profileId}` : '/config/domains';
    return this.rawRequest(url);
  }

  async updateDomains(data: any, profileId?: string): Promise<void> {
    const url = profileId ? `/config/domains?profileId=${profileId}` : '/config/domains';
    return this.rawRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getCriteria(profileId?: string): Promise<any> {
    const url = profileId ? `/config/criteria?profileId=${profileId}` : '/config/criteria';
    return this.rawRequest(url);
  }

  async updateCriteria(data: any, profileId?: string): Promise<void> {
    const url = profileId ? `/config/criteria?profileId=${profileId}` : '/config/criteria';
    return this.rawRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getSettings(profileId?: string): Promise<any> {
    const url = profileId ? `/config/settings?profileId=${profileId}` : '/config/settings';
    return this.rawRequest(url);
  }

  async updateSettings(data: any, profileId?: string): Promise<void> {
    const url = profileId ? `/config/settings?profileId=${profileId}` : '/config/settings';
    return this.rawRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getDefaultPrompt(): Promise<{ default_prompt: string }> {
    return this.rawRequest('/config/settings/default-prompt');
  }

  async getProblemTypes(): Promise<any> {
    return this.rawRequest('/config/problem-types');
  }

  async getSolutionTypes(): Promise<any> {
    return this.rawRequest('/config/solution-types');
  }

  async getMonetizationModels(profileId?: string): Promise<any> {
    const url = profileId ? `/config/monetization-models?profileId=${profileId}` : '/config/monetization-models';
    return this.rawRequest(url);
  }

  async updateMonetizationModels(data: any, profileId?: string): Promise<void> {
    const url = profileId ? `/config/monetization-models?profileId=${profileId}` : '/config/monetization-models';
    return this.rawRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getTargetAudiences(profileId?: string): Promise<any> {
    const url = profileId ? `/config/target-audiences?profileId=${profileId}` : '/config/target-audiences';
    return this.rawRequest(url);
  }

  async updateTargetAudiences(data: any, profileId?: string): Promise<void> {
    const url = profileId ? `/config/target-audiences?profileId=${profileId}` : '/config/target-audiences';
    return this.rawRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // API Keys endpoints
  async getApiKeys(): Promise<any[]> {
    return this.rawRequest('/config/api-keys');
  }

  async getApiKey(id: number): Promise<any> {
    return this.rawRequest(`/config/api-keys/${id}`);
  }

  async createApiKey(data: { name: string; provider: string; api_key: string; model?: string; is_active?: boolean }): Promise<any> {
    return this.rawRequest('/config/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApiKey(id: number, data: Partial<{ name: string; provider: string; api_key: string; model: string; is_active: boolean }>): Promise<any> {
    return this.rawRequest(`/config/api-keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApiKey(id: number): Promise<void> {
    return this.rawRequest(`/config/api-keys/${id}`, {
      method: 'DELETE',
    });
  }

  async activateApiKey(id: number): Promise<any> {
    return this.rawRequest(`/config/api-keys/${id}/activate`, {
      method: 'POST',
    });
  }

  // AI Models endpoints
  async getAIModels(): Promise<any[]> {
    return this.rawRequest('/config/ai-models');
  }

  async getAllAIModels(): Promise<any[]> {
    return this.rawRequest('/config/ai-models?all=true');
  }

  async getAIModelsByProvider(provider: string): Promise<any[]> {
    return this.rawRequest(`/config/ai-models/${provider}`);
  }

  async createAIModel(data: { provider: string; model_id: string; display_name: string; is_default?: boolean; description?: string }): Promise<any> {
    return this.rawRequest('/config/ai-models', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAIModel(id: number, data: Partial<{ model_id: string; display_name: string; is_available: boolean; is_default: boolean; description: string }>): Promise<any> {
    return this.rawRequest(`/config/ai-models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAIModel(id: number): Promise<void> {
    return this.rawRequest(`/config/ai-models/${id}`, {
      method: 'DELETE',
    });
  }

  // Configuration Profiles endpoints
  async getConfigProfiles(): Promise<any[]> {
    return this.rawRequest('/config/profiles');
  }

  async getActiveConfigProfile(): Promise<any> {
    return this.rawRequest('/config/profiles/active');
  }

  async createConfigProfile(data: { name: string; folder_name: string; description?: string }): Promise<any> {
    return this.rawRequest('/config/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async activateConfigProfile(id: string): Promise<any> {
    return this.rawRequest(`/config/profiles/${id}/activate`, {
      method: 'POST',
    });
  }

  async deleteConfigProfile(id: string): Promise<void> {
    return this.rawRequest(`/config/profiles/${id}`, {
      method: 'DELETE',
    });
  }

  async cloneConfigProfile(id: string, data: { name: string; folder_name: string }): Promise<any> {
    return this.rawRequest(`/config/profiles/${id}/clone`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Generation Slots endpoints
  async getGenerationSlots(): Promise<any[]> {
    return this.rawRequest('/config/generation-slots');
  }

  async getGenerationSlot(slotNumber: number): Promise<any> {
    return this.rawRequest(`/config/generation-slots/${slotNumber}`);
  }

  async updateGenerationSlot(slotNumber: number, data: {
    profile_id?: string | null;
    is_enabled?: boolean;
    auto_generate?: boolean;
    auto_generate_interval_minutes?: number;
  }): Promise<any> {
    return this.rawRequest(`/config/generation-slots/${slotNumber}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async ensureGenerationSlots(count: number): Promise<any[]> {
    return this.rawRequest('/config/generation-slots/ensure', {
      method: 'POST',
      body: JSON.stringify({ count }),
    });
  }
}

export const api = new ApiClient();
