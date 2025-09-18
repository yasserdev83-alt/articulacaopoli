import { useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductivityData } from "@/hooks/useProductivityData";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Award,
  Calendar,
  Filter,
  UserCheck
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";

export function Dashboard() {
  const { getMetrics, getAgentPerformance, getWeeklyData, loading, agents } = useProductivityData();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const metrics = getMetrics(selectedPeriod, selectedAgent === 'all' ? undefined : selectedAgent);
  const agentPerformance = getAgentPerformance();
  const weeklyData = getWeeklyData();

  const topAgents = agentPerformance.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da produtividade da equipe
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-48">
              <UserCheck className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por agente" />
            </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Agentes</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
          </Select>
          
          {(['week', 'month', 'quarter'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === 'week' ? 'Semana' : period === 'month' ? 'Mês' : 'Trimestre'}
            </Button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Atualizações"
          value={metrics.totalUpdates.toLocaleString()}
          description={
            selectedPeriod === 'week' ? 'Esta semana' : 
            selectedPeriod === 'month' ? 'Este mês' : 
            'Este trimestre'
          }
          icon={BarChart3}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Agentes Ativos"
          value={metrics.totalAgents}
          description="Participando ativamente"
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          title="Média por Agente"
          value={metrics.averageUpdatesPerAgent}
          description={
            selectedPeriod === 'week' ? 'Atualizações/semana' : 
            selectedPeriod === 'month' ? 'Atualizações/mês' : 
            'Atualizações/trimestre'
          }
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
        />
        <MetricCard
          title="Top Performer"
          value={metrics.topPerformer.agentName}
          description={`${metrics.topPerformer.updatesCount} atualizações`}
          icon={Award}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance Chart */}
        <Card className="shadow-card border-0 bg-gradient-to-br from-card/50 to-card">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Calendar className="h-5 w-5 text-primary" />
              Performance Semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart 
                data={weeklyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="weekLabel" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  labelFormatter={(value) => value}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                />
                {agentPerformance.slice(0, 4).map((agent, index) => {
                  const colors = [
                    'hsl(220, 98%, 61%)', // Blue
                    'hsl(142, 71%, 45%)', // Green
                    'hsl(262, 83%, 58%)', // Purple
                    'hsl(346, 87%, 43%)'  // Red
                  ];
                  
                  return (
                    <Line
                      key={agent.agentName}
                      type="monotone"
                      dataKey={agent.agentName}
                      stroke={colors[index]}
                      strokeWidth={3}
                      connectNulls={false}
                      dot={{ 
                        r: 6, 
                        fill: colors[index], 
                        strokeWidth: 2, 
                        stroke: 'hsl(var(--background))' 
                      }}
                      activeDot={{ 
                        r: 8, 
                        fill: colors[index],
                        stroke: 'hsl(var(--background))',
                        strokeWidth: 2
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="shadow-card border-0 bg-gradient-to-br from-card/50 to-card">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Award className="h-5 w-5 text-primary" />
              Ranking de Produtividade
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={topAgents} 
                layout="vertical"
                margin={{ top: 20, right: 60, left: 120, bottom: 20 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.2}
                  horizontal={false}
                />
                <XAxis 
                  type="number" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  domain={[0, 'dataMax + 20']}
                />
                <YAxis 
                  dataKey="agentName" 
                  type="category" 
                  width={100}
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fontSize: 13, 
                    fill: 'hsl(var(--foreground))',
                    fontWeight: 500
                  }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value, name) => [
                    `${value} atualizações`,
                    'Total'
                  ]}
                />
                <Bar 
                  dataKey="totalUpdates" 
                  radius={[0, 8, 8, 0]}
                  maxBarSize={40}
                >
                  {topAgents.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${220 - index * 20}, 98%, ${61 + index * 5}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card border-0 bg-gradient-to-br from-card/50 to-card">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <BarChart3 className="h-5 w-5 text-primary" />
              Atividade Recente
            </div>
            <Button variant="outline" size="sm" className="border-border/50 hover:bg-muted/50">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {agentPerformance.slice(0, 6).map((agent, index) => {
              const colors = [
                'hsl(220, 98%, 61%)', // Blue
                'hsl(142, 71%, 45%)', // Green
                'hsl(262, 83%, 58%)', // Purple
                'hsl(346, 87%, 43%)', // Red
                'hsl(43, 89%, 58%)',  // Yellow
                'hsl(14, 90%, 53%)'   // Orange
              ];
              
              return (
                <div key={agent.agentId} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 border border-border/30">
                  <div className="flex items-center gap-4">
                    <div 
                      className="h-12 w-12 rounded-xl flex items-center justify-center font-semibold text-white shadow-lg"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    >
                      {agent.agentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{agent.agentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {agent.weeklyUpdates} atualizações esta semana
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {agent.totalUpdates} total
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Última: {new Date(agent.lastUpdate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}