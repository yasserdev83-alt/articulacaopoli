import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductivityData } from "@/hooks/useProductivityData";
import { 
  Users, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  Award
} from "lucide-react";

export function Equipe() {
  const { getAgentPerformance, records, loading, agents, roles } = useProductivityData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [sortBy, setSortBy] = useState<'totalUpdates' | 'weeklyUpdates' | 'name'>('totalUpdates');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const agentPerformance = getAgentPerformance();

  // Filter and sort agents
  const filteredAgents = agentPerformance
    .filter(agent => 
      agent.agentName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.agentName.localeCompare(b.agentName);
        case 'weeklyUpdates':
          return b.weeklyUpdates - a.weeklyUpdates;
        default:
          return b.totalUpdates - a.totalUpdates;
      }
    });

  const getAgentRecords = (agentName: string) => {
    return records.filter(record => record.agent?.name === agentName);
  };

  const getAgentRoleStats = (agentName: string) => {
    const agentRecords = getAgentRecords(agentName);
    const roleStats = new Map<string, number>();
    
    agentRecords.forEach(record => {
      const roleName = record.leadership_role?.name || 'Unknown';
      const current = roleStats.get(roleName) || 0;
      roleStats.set(roleName, current + record.updates_count);
    });

    return Array.from(roleStats.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
  };

  const getPerformanceTrend = (agent: any) => {
    // Simple trend calculation based on weekly vs previous week
    const trend = Math.random() > 0.5 ? 'up' : 'down'; // Mock trend
    const percentage = Math.floor(Math.random() * 30) + 1;
    return { trend, percentage };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Equipe
          </h1>
          <p className="text-muted-foreground">
            Gerenciar e monitorar performance dos agentes
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar agente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cargos</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalUpdates">Total de atualizações</SelectItem>
                <SelectItem value="weeklyUpdates">Semana atual</SelectItem>
                <SelectItem value="name">Nome</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agentPerformance.length}</p>
                <p className="text-sm text-muted-foreground">Agentes Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(agentPerformance.reduce((sum, agent) => sum + agent.weeklyUpdates, 0) / agentPerformance.length)}
                </p>
                <p className="text-sm text-muted-foreground">Média Semanal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agentPerformance[0]?.agentName || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Top Performer</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent, index) => {
          const roleStats = getAgentRoleStats(agent.agentName);
          const trend = getPerformanceTrend(agent);
          
          return (
            <Card key={agent.agentId} className="shadow-card hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {agent.agentName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.agentName}</CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        {index === 0 && <Award className="h-4 w-4 text-warning" />}
                        <Badge variant={index < 3 ? "default" : "secondary"} className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`flex items-center gap-1 text-sm ${
                      trend.trend === 'up' ? 'text-success' : 'text-destructive'
                    }`}>
                      {trend.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {trend.percentage}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">{agent.totalUpdates}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">{agent.weeklyUpdates}</p>
                    <p className="text-xs text-muted-foreground">Esta Semana</p>
                  </div>
                </div>

                {/* Top Roles */}
                <div>
                  <p className="text-sm font-medium mb-2">Principais Cargos:</p>
                  <div className="space-y-1">
                    {roleStats.map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate">{role}</span>
                        <Badge variant="outline" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Last Update */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Calendar className="h-3 w-3" />
                  <span>Última atualização: {new Date(agent.lastUpdate).toLocaleDateString('pt-BR')}</span>
                </div>

                {/* Action Button */}
                <Button variant="outline" size="sm" className="w-full">
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}