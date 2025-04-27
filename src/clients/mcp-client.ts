/**
 * MCP Client for AI Chatbots
 * 
 * This client provides an interface for AI chatbots to interact with the velo-tracker MCP server.
 */

export class MCPClient {
  private baseUrl: string;
  
  constructor(host: string = 'localhost', port: number = 3000) {
    this.baseUrl = `http://${host}:${port}/api`;
  }
  
  /**
   * Make an HTTP request to the MCP server
   */
  private async request(method: string, path: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    const options: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    };
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }
    
    return data;
  }
  
  /**
   * Feature Management
   */
  
  // Get all features
  async getFeatures(status?: string, priority?: string): Promise<any[]> {
    let path = '/features';
    const params = new URLSearchParams();
    
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    
    if (params.toString()) {
      path += `?${params.toString()}`;
    }
    
    return this.request('GET', path);
  }
  
  // Get a specific feature
  async getFeature(id: string): Promise<any> {
    return this.request('GET', `/features/${id}`);
  }
  
  // Create a new feature
  async createFeature(name: string, description: string, priority?: string): Promise<any> {
    return this.request('POST', '/features', {
      name,
      description,
      priority: priority || 'medium'
    });
  }
  
  // Update a feature
  async updateFeature(id: string, updates: any): Promise<any> {
    return this.request('PUT', `/features/${id}`, updates);
  }
  
  /**
   * Session Management
   */
  
  // Get all sessions
  async getSessions(profile?: string, qProfile?: string, limit?: number): Promise<any[]> {
    let path = '/sessions';
    const params = new URLSearchParams();
    
    if (profile) params.append('profile', profile);
    if (qProfile) params.append('qProfile', qProfile);
    if (limit) params.append('limit', limit.toString());
    
    if (params.toString()) {
      path += `?${params.toString()}`;
    }
    
    return this.request('GET', path);
  }
  
  // Get active session
  async getActiveSession(profile?: string): Promise<any> {
    let path = '/sessions/active';
    
    if (profile) {
      path += `?profile=${encodeURIComponent(profile)}`;
    }
    
    return this.request('GET', path);
  }
  
  // Start a new session
  async startSession(profile?: string, qProfile?: string): Promise<any> {
    return this.request('POST', '/sessions/start', {
      profile: profile || 'default',
      qProfile: qProfile || 'default'
    });
  }
  
  // End an active session
  async endSession(profile?: string, sessionId?: string): Promise<any> {
    return this.request('POST', '/sessions/end', {
      profile: profile || 'default',
      sessionId
    });
  }
  
  /**
   * Progress Tracking
   */
  
  // Get progress updates for a feature
  async getProgress(featureId: string): Promise<any[]> {
    return this.request('GET', `/progress/${featureId}`);
  }
  
  // Add a progress update
  async addProgress(featureId: string, message: string, percentage: number): Promise<any> {
    return this.request('POST', '/progress', {
      featureId,
      message,
      percentage
    });
  }
}
