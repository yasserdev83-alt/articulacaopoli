import { useState, useEffect } from 'react';
import { ProductivityRecord, DashboardMetrics, AgentPerformance, Agent, LeadershipRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function useProductivityData() {
  const [records, setRecords] = useState<ProductivityRecord[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [roles, setRoles] = useState<LeadershipRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [recordsResult, agentsResult, rolesResult] = await Promise.all([
        supabase
          .from('productivity_records')
          .select(`
            *,
            agent:agents(*),
            leadership_role:leadership_roles(*)
          `)
          .order('date', { ascending: false }),
        supabase.from('agents').select('*').order('name'),
        supabase.from('leadership_roles').select('*').order('name')
      ]);

      if (recordsResult.error) throw recordsResult.error;
      if (agentsResult.error) throw agentsResult.error;
      if (rolesResult.error) throw rolesResult.error;

      setRecords(recordsResult.data || []);
      setAgents(agentsResult.data || []);
      setRoles(rolesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addRecord = async (record: Omit<ProductivityRecord, 'id' | 'created_at' | 'updated_at' | 'agent' | 'leadership_role'>) => {
    try {
      const { data, error } = await supabase
        .from('productivity_records')
        .insert([record])
        .select(`
          *,
          agent:agents(*),
          leadership_role:leadership_roles(*)
        `)
        .single();

      if (error) throw error;

      if (data) {
        setRecords(prev => [data, ...prev]);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error adding record:', error);
      return { success: false, error };
    }
  };

  const getMetrics = (period: 'week' | 'month' | 'quarter' = 'week', agentId?: string): DashboardMetrics => {
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
      // Use record.date (data da atualização) e força timezone local
      const recordDate = new Date(record.date + 'T00:00:00');
      const dateMatches = recordDate >= startDate;
      const agentMatches = !agentId || record.agent_id === agentId;
      return dateMatches && agentMatches;
    });

    const totalUpdates = filteredRecords.reduce((sum, record) => sum + record.updates_count, 0);
    const agentStats = new Map<string, number>();
    
    filteredRecords.forEach(record => {
      const agentName = record.agent?.name || 'Unknown';
      const current = agentStats.get(agentName) || 0;
      agentStats.set(agentName, current + record.updates_count);
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
      lastUpdateDate: string;
      records: ProductivityRecord[];
    }>();

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    records.forEach(record => {
      // Use record.date (data da atualização) para comparações
      const recordDate = new Date(record.date + 'T00:00:00'); // Força timezone local
      const agentName = record.agent?.name || 'Unknown';
      const current = agentStats.get(agentName) || {
        totalUpdates: 0,
        weeklyUpdates: 0,
        lastUpdate: '',
        lastUpdateDate: '',
        records: [],
      };

      current.totalUpdates += record.updates_count;
      current.records.push(record);
      
      if (recordDate >= weekAgo) {
        current.weeklyUpdates += record.updates_count;
      }
      
      // Use sempre o record.date (data da atualização) para lastUpdate
      if (!current.lastUpdateDate || record.date > current.lastUpdateDate) {
        current.lastUpdate = record.updated_at || record.created_at;
        current.lastUpdateDate = record.date;
      }

      agentStats.set(agentName, current);
    });

    return Array.from(agentStats.entries()).map(([agentName, stats]) => {
      const agent = agents.find(a => a.name === agentName);
      return {
        agentId: agent?.id || '',
        agentName,
        totalUpdates: stats.totalUpdates,
        weeklyUpdates: stats.weeklyUpdates,
        dailyAverage: Math.round(stats.weeklyUpdates / 7),
        lastUpdate: stats.lastUpdateDate, // Use a data da atualização (record.date)
      };
    }).sort((a, b) => b.totalUpdates - a.totalUpdates);
  };

  const getWeeklyData = () => {
    const weeklyStats = new Map<string, Map<string, number>>();
    
    records.forEach(record => {
      // Use record.date (data da atualização) e força timezone local
      const date = new Date(record.date + 'T00:00:00');
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyStats.has(weekKey)) {
        weeklyStats.set(weekKey, new Map());
      }
      
      const weekData = weeklyStats.get(weekKey)!;
      const agentName = record.agent?.name || 'Unknown';
      const current = weekData.get(agentName) || 0;
      weekData.set(agentName, current + record.updates_count);
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
    agents,
    roles,
    loading,
    addRecord,
    getMetrics,
    getAgentPerformance,
    getWeeklyData,
    refetch: fetchData,
  };
}