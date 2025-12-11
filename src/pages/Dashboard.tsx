import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, CheckCircle2, Circle, Clock, Search } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
}

type StatusFilter = Task["status"] | "all";
type PriorityFilter = Task["priority"] | "all";

const STATUS_SECTIONS: Array<{
  key: Task["status"];
  title: string;
  subtitle: string;
  accent: string;
  badge: string;
}> = [
  {
    key: "pending",
    title: "Backlog",
    subtitle: "Tarefas aguardando início",
    accent: "border-dashed border-amber-200",
    badge: "bg-amber-50 text-amber-700",
  },
  {
    key: "in_progress",
    title: "Em Execução",
    subtitle: "Atividades em andamento",
    accent: "border-dashed border-blue-200",
    badge: "bg-blue-50 text-blue-700",
  },
  {
    key: "completed",
    title: "Concluídas",
    subtitle: "Resultados entregues",
    accent: "border-dashed border-emerald-200",
    badge: "bg-emerald-50 text-emerald-700",
  },
];

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  high: "Alta prioridade",
  medium: "Prioridade média",
  low: "Baixa prioridade",
};

const Dashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({ title: "", description: "", status: "pending", priority: "medium" });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditingOpen, setIsEditingOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks((data as Task[]) || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Erro ao carregar tarefas",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTask.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, insira um título para a tarefa",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("tasks").insert([newTask]);
      
      if (error) throw error;
      
      toast({
        title: "Tarefa criada!",
        description: "A tarefa foi adicionada com sucesso",
      });
      
      setNewTask({ title: "", description: "", status: "pending", priority: "medium" });
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Erro ao criar tarefa",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  const updateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: editingTask.title,
          description: editingTask.description,
          status: editingTask.status,
          priority: editingTask.priority,
        })
        .eq("id", editingTask.id);

      if (error) throw error;

      toast({
        title: "Tarefa atualizada!",
        description: "As alterações foram salvas",
      });

      setEditingTask(null);
      setIsEditingOpen(false);
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Erro ao atualizar tarefa",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Tarefa excluída",
        description: "A tarefa foi removida com sucesso",
      });

      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Erro ao excluir tarefa",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-warning" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive";
      case "medium":
        return "bg-warning/10 text-warning border-warning";
      case "low":
        return "bg-success/10 text-success border-success";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setIsEditingOpen(true);
  };

  const closeEditModal = () => {
    setIsEditingOpen(false);
    setEditingTask(null);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = searchTerm
        ? task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
        : true;
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "completed").length;
    const inProgress = tasks.filter((task) => task.status === "in_progress").length;
    const pending = tasks.filter((task) => task.status === "pending").length;
    const highPriority = tasks.filter((task) => task.priority === "high").length;
    const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

    return [
      { label: "Total de tarefas", value: tasks.length, description: "Registro geral" },
      { label: "Concluídas", value: completed, description: `${completionRate}% do backlog` },
      { label: "Em andamento", value: inProgress, description: `${pending} aguardando início` },
      { label: "Prioridade alta", value: highPriority, description: "Itens críticos" },
    ];
  }, [tasks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="container mx-auto px-4 py-10 space-y-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">Operações</p>
            <h1 className="text-4xl md:text-5xl font-bold bg-tech-gradient bg-clip-text text-transparent">
              Central de Tarefas
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Acompanhe o progresso do time com métricas em tempo real, filtros inteligentes e um quadro visual
              inspirado em metodologias ágeis.
            </p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-5 border border-white/10 bg-background/70 backdrop-blur">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-semibold mt-2">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </Card>
          ))}
        </section>

        <Card className="p-6 border border-white/10 bg-background/80 backdrop-blur">
          <div className="flex flex-col gap-2 mb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Filtros inteligentes</h2>
              <p className="text-sm text-muted-foreground">Combine busca textual com status e prioridade.</p>
            </div>
            <p className="text-sm text-muted-foreground">{filteredTasks.length} resultados visíveis</p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por título ou descrição"
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as PriorityFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold">Nova tarefa</h2>
                <p className="text-sm text-muted-foreground">Cadastre itens no backlog com prioridade e status.</p>
              </div>
            </div>
            <form onSubmit={createTask} className="space-y-4">
              <Input
                placeholder="Título da tarefa"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newTask.status} onValueChange={(value) => setNewTask({ ...newTask, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar tarefa
              </Button>
            </form>
          </Card>

          <Card className="p-6 shadow-lg border-accent/40">
            <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">Playbook</p>
            <h2 className="text-2xl font-semibold mb-4">Boas práticas do time</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                Priorize tarefas com impacto direto nas entregas críticas da sprint.
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                Atualize status e prioridade sempre que houver mudança no escopo.
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                Use comentários na descrição para registrar contexto e dependências.
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                Revise o quadro diariamente antes do stand-up para evitar gargalos.
              </li>
            </ul>
            <div className="mt-6 rounded-lg border border-dashed border-muted-foreground/40 p-4 text-sm">
              Selecione qualquer tarefa no quadro para abrir o modal de edição com todos os detalhes.
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Quadro de execução</h2>
            <p className="text-sm text-muted-foreground">Agrupado por status com indicadores visuais.</p>
          </div>
          {filteredTasks.length === 0 ? (
            <Card className="p-10 text-center border-dashed">
              <p className="text-muted-foreground">Nenhuma tarefa corresponde aos filtros aplicados.</p>
            </Card>
          ) : (
            <div className="grid gap-6 xl:grid-cols-3">
              {STATUS_SECTIONS.map((section) => {
                const tasksForStatus = filteredTasks.filter((task) => task.status === section.key);

                return (
                  <Card key={section.key} className={`p-5 space-y-4 ${section.accent}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{section.title}</h3>
                        <p className="text-sm text-muted-foreground">{section.subtitle}</p>
                      </div>
                      <Badge variant="secondary" className={section.badge}>
                        {tasksForStatus.length}
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      {tasksForStatus.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-center text-sm text-muted-foreground">
                          Nenhum item nesta coluna
                        </div>
                      ) : (
                        tasksForStatus.map((task) => (
                          <div key={task.id} className="rounded-xl border border-muted/50 bg-background/80 p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(task.status)}
                                  <p className="font-semibold">{task.title}</p>
                                </div>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground">{task.description}</p>
                                )}
                              </div>
                              <Badge variant="outline" className={`capitalize ${getPriorityColor(task.priority)}`}>
                                {PRIORITY_LABEL[task.priority]}
                              </Badge>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                              <p>Atualizada em {new Date(task.updated_at).toLocaleDateString("pt-BR")}</p>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(task)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <Dialog open={isEditingOpen} onOpenChange={(open) => (open ? setIsEditingOpen(true) : closeEditModal())}>
        <DialogContent className="max-w-2xl">
          {editingTask ? (
            <form onSubmit={updateTask} className="space-y-6">
              <DialogHeader>
                <DialogTitle>Editar tarefa</DialogTitle>
                <DialogDescription>Atualize informações, status e prioridade antes de salvar.</DialogDescription>
              </DialogHeader>
              <Input
                placeholder="Título da tarefa"
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={editingTask.description || ""}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                rows={4}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Select value={editingTask.priority} onValueChange={(value) => setEditingTask({ ...editingTask, priority: value as Task["priority"] })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={editingTask.status} onValueChange={(value) => setEditingTask({ ...editingTask, status: value as Task["status"] })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="flex gap-2 sm:justify-between">
                <Button type="button" variant="outline" onClick={closeEditModal}>Cancelar</Button>
                <Button type="submit">Salvar alterações</Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>Nenhuma tarefa selecionada</DialogTitle>
                <DialogDescription>Escolha um item no quadro para editar.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={closeEditModal}>Fechar</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
