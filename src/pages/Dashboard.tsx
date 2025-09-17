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
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Performance Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="week" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                />
                {agentPerformance.slice(0, 4).map((agent, index) => (
                  <Line
                    key={agent.agentName}
                    type="monotone"
                    dataKey={agent.agentName}
                    stroke={`hsl(${214 + index * 30}, 84%, ${56 + index * 5}%)`}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    label={{
                      position: 'top',
                      fill: `hsl(${214 + index * 30}, 84%, ${56 + index * 5}%)`,
                      fontSize: 12
                    }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Ranking de Produtividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={topAgents} 
                layout="horizontal"
                margin={{ top: 10, right: 60, left: 20, bottom: 10 }}
              >
                <XAxis 
                  type="number" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  dataKey="agentName" 
                  type="category" 
                  width={140}
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="totalUpdates" 
                  fill="#60A5FA"
                  radius={[0, 6, 6, 0]}
                  label={{ 
                    position: 'right', 
                    fill: 'hsl(var(--foreground))', 
                    fontSize: 14,
                    fontWeight: 500
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Atividade Recente
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agentPerformance.slice(0, 6).map((agent, index) => (
              <div key={agent.agentId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {agent.agentName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{agent.agentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {agent.weeklyUpdates} atualizações esta semana
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {agent.totalUpdates} total
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Última: {new Date(agent.lastUpdate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}