export interface Agent {
  id: string;
  name: string;
  created_at?: string;
}

export interface LeadershipRole {
  id: string;
  name: string;
  created_at?: string;
}

export interface ProductivityRecord {
  id: string;
  agent_id: string;
  leadership_role_id: string;
  updates_count: number;
  date: string;
  created_at: string;
  updated_at?: string;
  // Joined fields
  agent?: Agent;
  leadership_role?: LeadershipRole;
}

export interface DashboardMetrics {
  totalUpdates: number;
  totalAgents: number;
  averageUpdatesPerAgent: number;
  topPerformer: {
    agentName: string;
    updatesCount: number;
  };
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalUpdates: number;
  weeklyUpdates: number;
  dailyAverage: number;
  lastUpdate: string;
}

export interface WeeklyData {
  week: string;
  [agentName: string]: string | number;
}