export interface Agent {
  id: string;
  name: string;
}

export interface LeadershipRole {
  id: string;
  name: string;
}

export interface ProductivityRecord {
  id: string;
  agentId: string;
  agentName: string;
  leadershipRoleId: string;
  leadershipRoleName: string;
  updatesCount: number;
  date: string;
  createdAt: string;
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

// Constants
export const AGENTS: Agent[] = [
  { id: '1', name: 'Monica' },
  { id: '2', name: 'Marina' },
  { id: '3', name: 'Ana Paula' },
  { id: '4', name: 'Elisangela' },
  { id: '5', name: 'Karla' },
  { id: '6', name: 'Jessica' },
  { id: '7', name: 'Silvana' },
  { id: '8', name: 'Rosa Maria' },
];

export const LEADERSHIP_ROLES: LeadershipRole[] = [
  { id: '1', name: 'Prefeito' },
  { id: '2', name: 'Vice-Prefeito' },
  { id: '3', name: 'Ex Prefeito' },
  { id: '4', name: 'Cand. Prefeito' },
  { id: '5', name: 'Vereador' },
  { id: '6', name: 'Suplente Vereador' },
  { id: '7', name: 'Lideranças' },
  { id: '8', name: 'Dep. Estadual' },
  { id: '9', name: 'Dep. Federal' },
];