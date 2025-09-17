import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProductivityData } from "@/hooks/useProductivityData";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Plus, Save } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function CadastrarProdutividade() {
  const { addRecord, agents, roles, loading } = useProductivityData();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    agentId: "",
    leadershipRoleId: "",
    updatesCount: "",
    date: new Date(),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agentId || !formData.leadershipRoleId || !formData.updatesCount) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const updatesCount = parseInt(formData.updatesCount);
    if (isNaN(updatesCount) || updatesCount <= 0) {
      toast({
        title: "Erro de validação",
        description: "O número de atualizações deve ser um número válido maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addRecord({
        agent_id: formData.agentId,
        leadership_role_id: formData.leadershipRoleId,
        updates_count: updatesCount,
        date: formData.date.toISOString().split('T')[0],
      });

      if (result.success) {
        const agent = agents.find(a => a.id === formData.agentId);
        toast({
          title: "Sucesso!",
          description: `Produtividade de ${agent?.name} registrada com sucesso.`,
        });

        // Reset form
        setFormData({
          agentId: "",
          leadershipRoleId: "",
          updatesCount: "",
          date: new Date(),
        });
      } else {
        throw new Error('Failed to save record');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <Plus className="h-8 w-8 text-primary" />
          Cadastrar Produtividade
        </h1>
        <p className="text-muted-foreground mt-2">
          Registre a produtividade diária dos agentes da equipe
        </p>
      </div>

      {/* Form */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl">Dados de Produtividade</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agent Selection */}
            <div className="space-y-2">
              <Label htmlFor="agent">Agente *</Label>
              <Select
                value={formData.agentId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, agentId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o agente" />
                </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>

            {/* Leadership Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Cargo da Liderança *</Label>
              <Select
                value={formData.leadershipRoleId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, leadershipRoleId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>

            {/* Updates Count */}
            <div className="space-y-2">
              <Label htmlFor="updates">Total de Atualizações *</Label>
              <Input
                id="updates"
                type="number"
                min="1"
                placeholder="Ex: 15"
                value={formData.updatesCount}
                onChange={(e) => setFormData(prev => ({ ...prev, updatesCount: e.target.value }))}
              />
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Data da Atualização *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(formData.date, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Produtividade
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({
                  agentId: "",
                  leadershipRoleId: "",
                  updatesCount: "",
                  date: new Date(),
                })}
              >
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline" size="sm" className="justify-start">
              Cadastrar em Lote
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              Importar CSV
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              Ver Histórico
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}