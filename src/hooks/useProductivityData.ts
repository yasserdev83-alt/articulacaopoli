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

  const getMetrics = (period: 'week' | 'month' | 'quarter' = 'week', agentId?: string, dateRange?: { from?: Date; to?: Date }): DashboardMetrics => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    // Use custom date range if provided, otherwise use period-based filtering
    if (dateRange?.from || dateRange?.to) {
      startDate = dateRange.from || new Date(0); // Use epoch if no start date
      endDate = dateRange.to || new Date(); // Use now if no end date
    } else {
      // Default period-based filtering
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
    }
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const filteredRecords = records.filter(record => {
      // Use record.date (data da atualização) e força timezone local
      const recordDate = new Date(record.date + 'T00:00:00');
      const dateMatches = recordDate >= startDate && recordDate <= endDate;
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

  const getAgentPerformance = (agentId?: string, dateRange?: { from?: Date; to?: Date }): AgentPerformance[] => {
    const agentStats = new Map<string, {
      totalUpdates: number;
      weeklyUpdates: number;
      lastUpdate: string;
      lastUpdateDate: string;
      records: ProductivityRecord[];
    }>();

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Apply date range filtering if provided
    let startDate = new Date(0);
    let endDate = new Date();
    
    if (dateRange?.from || dateRange?.to) {
      startDate = dateRange.from || new Date(0);
      endDate = dateRange.to || new Date();
    }
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const filteredRecords = records.filter(record => {
      const recordDate = new Date(record.date + 'T00:00:00');
      const dateMatches = recordDate >= startDate && recordDate <= endDate;
      const agentMatches = !agentId || record.agent_id === agentId;
      return dateMatches && agentMatches;
    });

    filteredRecords.forEach(record => {
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
        current.lastUpdate = record.date; // Use diretamente a data da atualização
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

  const getWeeklyData = (agentId?: string, dateRange?: { from?: Date; to?: Date }) => {
    const weeklyStats = new Map<string, { weekLabel: string, agentData: Map<string, number>, date: Date }>();
    
    // Apply date range filtering if provided
    let startDate = new Date(0);
    let endDate = new Date();
    
    if (dateRange?.from || dateRange?.to) {
      startDate = dateRange.from || new Date(0);
      endDate = dateRange.to || new Date();
    }
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const filteredRecords = records.filter(record => {
      const recordDate = new Date(record.date + 'T00:00:00');
      const dateMatches = recordDate >= startDate && recordDate <= endDate;
      const agentMatches = !agentId || record.agent_id === agentId;
      return dateMatches && agentMatches;
    });
    
    filteredRecords.forEach(record => {
      // Use record.date (data da atualização) e força timezone local
      const date = new Date(record.date + 'T00:00:00');
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      // Calcular a semana do mês
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const firstWeekStart = new Date(firstDayOfMonth);
      firstWeekStart.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
      
      const weeksDiff = Math.floor((weekStart.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const weekOfMonth = Math.max(1, weeksDiff + 1);
      const weekLabel = `${weekOfMonth}ª semana`;
      
      if (!weeklyStats.has(weekKey)) {
        weeklyStats.set(weekKey, { 
          weekLabel, 
          agentData: new Map(), 
          date: weekStart 
        });
      }
      
      const weekData = weeklyStats.get(weekKey)!;
      const agentName = record.agent?.name || 'Unknown';
      const current = weekData.agentData.get(agentName) || 0;
      weekData.agentData.set(agentName, current + record.updates_count);
    });

    return Array.from(weeklyStats.entries())
      .map(([weekKey, { weekLabel, agentData, date }]) => {
        const result: any = { 
          week: weekKey, 
          weekLabel,
          sortDate: date.getTime(),
          totalUpdates: 0
        };
        agentData.forEach((updates, agentName) => {
          result[agentName] = updates;
          result.totalUpdates += updates;
        });
        return result;
      })
      .filter(week => week.totalUpdates > 0) // Only show weeks with data
      .sort((a, b) => a.sortDate - b.sortDate) // Sort chronologically
      .slice(0, 6); // Limit to 6 weeks max
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