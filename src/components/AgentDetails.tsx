import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useProductivityData } from "@/hooks/useProductivityData";
import { AgentPerformance, ProductivityRecord } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
} from "lucide-react";

interface AgentDetailsProps {
  agent: AgentPerformance;
  trigger: React.ReactNode;
}

export function AgentDetails({ agent, trigger }: AgentDetailsProps) {
  const { records, roles } = useProductivityData();
  const [open, setOpen] = useState(false);

  const getAgentRecords = () => {
    return records.filter(record => record.agent?.name === agent.agentName);
  };

  const getAgentRoleStats = () => {
    const agentRecords = getAgentRecords();
    const roleStats = new Map<string, number>();
    
    agentRecords.forEach(record => {
      const roleName = record.leadership_role?.name || 'Unknown';
      const current = roleStats.get(roleName) || 0;
      roleStats.set(roleName, current + record.updates_count);
    });

    return Array.from(roleStats.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const getMonthlyData = () => {
    const agentRecords = getAgentRecords();
    const monthlyStats = new Map<string, number>();
    
    agentRecords.forEach(record => {
      const date = new Date(record.date);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      const current = monthlyStats.get(monthKey) || 0;
      monthlyStats.set(monthKey, current + record.updates_count);
    });

    return Array.from(monthlyStats.entries())
      .map(([month, updates]) => ({ month, updates }))
      .sort((a, b) => new Date(`01 ${a.month}`).getTime() - new Date(`01 ${b.month}`).getTime())
      .slice(-6); // Last 6 months
  };

  const roleStats = getAgentRoleStats();
  const monthlyData = getMonthlyData();
  const agentRecords = getAgentRecords();

  const COLORS = ['#8B5DFF', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const totalRecords = agentRecords.length;
  const averageUpdatesPerRecord = totalRecords > 0 ? Math.round(agent.totalUpdates / totalRecords) : 0;
  // Pick the record with the greatest 'date' (yyyy-MM-dd) without relying on UTC parsing
  const lastRecord = agentRecords.reduce<ProductivityRecord | undefined>((latest, current) => {
    if (!latest) return current;
    return current.date > latest.date ? current : latest;
  }, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {agent.agentName.charAt(0)}
              </span>
            </div>
            Detalhes de {agent.agentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{agent.totalUpdates}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-success" />
                  <div>
                    <p className="text-2xl font-bold">{agent.weeklyUpdates}</p>
                    <p className="text-xs text-muted-foreground">Esta Semana</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-warning" />
                  <div>
                    <p className="text-2xl font-bold">{averageUpdatesPerRecord}</p>
                    <p className="text-xs text-muted-foreground">Média/Registro</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-info" />
                  <div>
                    <p className="text-2xl font-bold">{totalRecords}</p>
                    <p className="text-xs text-muted-foreground">Registros</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Monthly Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar 
                      dataKey="updates" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Distribuição por Cargo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={roleStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roleStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Role Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Detalhamento por Cargo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roleStats.map((role, index) => (
                  <div key={role.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{role.name}</span>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {role.value} atualizações
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((role.value / agent.totalUpdates) * 100).toFixed(1)}% do total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Last Activity */}
          {lastRecord && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Última Atividade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{lastRecord.leadership_role?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(lastRecord.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <Badge className="text-lg px-3 py-1">
                    {lastRecord.updates_count} atualizações
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}