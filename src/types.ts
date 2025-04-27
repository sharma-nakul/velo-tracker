export interface Session {
  id: string;
  profile: string;
  qProfile: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  autoMode?: boolean;
}

export interface SessionSummary {
  profile: string;
  totalSessions: number;
  totalDuration: number;
  averageDuration: number;
  firstSession: string;
  lastSession: string;
}

export interface ShellConfig {
  shell: 'bash' | 'zsh';
  rcFile: string;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  issueUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressUpdate {
  id: string;
  featureId: string;
  message: string;
  percentage: number;
  createdAt: string;
}
