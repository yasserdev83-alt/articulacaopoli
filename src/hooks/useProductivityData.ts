import { useState, useEffect } from 'react';
import { ProductivityRecord, DashboardMetrics, AgentPerformance, AGENTS, LEADERSHIP_ROLES } from '@/types';

// Mock data for demonstration
const generateMockData = (): ProductivityRecord[] => {
  const records: ProductivityRecord[] = [];
  const now = new Date();
  
  // Generate data for the last 30 days
  for (let i = 0; i < 150; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(i / 5));
    
    const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
    const role = LEADERSHIP_ROLES[Math.floor(Math.random() * LEADERSHIP_ROLES.length)];
    
    records.push({
      id: `record-${i}`,
      agentId: agent.id,
      agentName: agent.name,
      leadershipRoleId: role.id,
      leadershipRoleName: role.name,
      updatesCount: Math.floor(Math.random() * 15) + 1,
      date: date.toISOString().split('T')[0],
      createdAt: date.toISOString(),
    });
  }
  
  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export function useProductivityData() {
  const [records, setRecords] = useState<ProductivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRecords(generateMockData());
      setLoading(false);
    }, 500);
  }, []);

  const addRecord = (record: Omit<ProductivityRecord, 'id' | 'createdAt'>) => {
    const newRecord: ProductivityRecord = {
      ...record,
      id: `record-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setRecords(prev => [newRecord, ...prev]);
  };

  const getMetrics = (period: 'week' | 'month' | 'quarter' = 'week'): DashboardMetrics => {
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case 'month':
        startDate.setDate(1);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate.setMonth(currentQuarter * 3, 1);
        break;
    }
    startDate.setHours(0, 0, 0, 0);

    const filteredRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate;
    });

    const totalUpdates = filteredRecords.reduce((sum, record) => sum + record.updatesCount, 0);
    const agentStats = new Map<string, number>();
    
    filteredRecords.forEach(record => {
      const current = agentStats.get(record.agentName) || 0;
      agentStats.set(record.agentName, current + record.updatesCount);
    });

    const topPerformerEntry = Array.from(agentStats.entries())
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalUpdates,
      totalAgents: agentStats.size,
      averageUpdatesPerAgent: agentStats.size > 0 ? Math.round(totalUpdates / agentStats.size) : 0,
      topPerformer: {
        agentName: topPerformerEntry?.[0] || 'N/A',
        updatesCount: topPerformerEntry?.[1] || 0,
      },
    };
  };

  const getAgentPerformance = (): AgentPerformance[] => {
    const agentStats = new Map<string, {
      totalUpdates: number;
      weeklyUpdates: number;
      lastUpdate: string;
      records: ProductivityRecord[];
    }>();

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    records.forEach(record => {
      const recordDate = new Date(record.date);
      const current = agentStats.get(record.agentName) || {
        totalUpdates: 0,
        weeklyUpdates: 0,
        lastUpdate: '',
        records: [],
      };

      current.totalUpdates += record.updatesCount;
      current.records.push(record);
      
      if (recordDate >= weekAgo) {
        current.weeklyUpdates += record.updatesCount;
      }
      
      if (!current.lastUpdate || recordDate > new Date(current.lastUpdate)) {
        current.lastUpdate = record.date;
      }

      agentStats.set(record.agentName, current);
    });

    return Array.from(agentStats.entries()).map(([agentName, stats]) => {
      const agent = AGENTS.find(a => a.name === agentName);
      return {
        agentId: agent?.id || '',
        agentName,
        totalUpdates: stats.totalUpdates,
        weeklyUpdates: stats.weeklyUpdates,
        dailyAverage: Math.round(stats.weeklyUpdates / 7),
        lastUpdate: stats.lastUpdate,
      };
    }).sort((a, b) => b.totalUpdates - a.totalUpdates);
  };

  const getWeeklyData = () => {
    const weeklyStats = new Map<string, Map<string, number>>();
    
    records.forEach(record => {
      const date = new Date(record.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyStats.has(weekKey)) {
        weeklyStats.set(weekKey, new Map());
      }
      
      const weekData = weeklyStats.get(weekKey)!;
      const current = weekData.get(record.agentName) || 0;
      weekData.set(record.agentName, current + record.updatesCount);
    });

    return Array.from(weeklyStats.entries())
      .map(([weekKey, agentData]) => {
        const result: any = { week: weekKey };
        agentData.forEach((updates, agentName) => {
          result[agentName] = updates;
        });
        return result;
      })
      .sort((a, b) => new Date(b.week).getTime() - new Date(a.week).getTime())
      .slice(0, 8);
  };

  return {
    records,
    loading,
    addRecord,
    getMetrics,
    getAgentPerformance,
    getWeeklyData,
  };
}