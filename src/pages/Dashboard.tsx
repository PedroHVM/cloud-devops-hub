import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, CheckCircle2, Circle, Clock, ListTodo } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({ title: "", description: "", status: "pending", priority: "medium" });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const taskStats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "completed").length;
    const inProgress = tasks.filter((task) => task.status === "in_progress").length;
    const pending = tasks.filter((task) => task.status === "pending").length;

    return {
      total: tasks.length,
      completed,
      inProgress,
      pending,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (priorityFilter === "all") return tasks;
    return tasks.filter((task) => task.priority === priorityFilter);
  }, [tasks, priorityFilter]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingTask(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingTask(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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

      closeEditDialog();
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

      if (editingTask?.id === id) {
        closeEditDialog();
      }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-2 items-center text-center">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded"
          >
            <h1 className="text-4xl font-bold mb-2 bg-tech-gradient bg-clip-text text-transparent">
              Dashboard de Tarefas
            </h1>
          </button>
          <p className="text-muted-foreground">Sistema completo de gerenciamento com API RESTful</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <Card className="p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de tarefas</p>
                <p className="text-3xl font-bold">{taskStats.total}</p>
              </div>
              <span className="p-3 rounded-full border bg-background">
                <ListTodo className="w-5 h-5" />
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Monitoramento em tempo real</p>
          </Card>

          <Card className="p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-3xl font-bold">{taskStats.completed}</p>
              </div>
              <span className="p-3 rounded-full border bg-background">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Fluxo entregue</p>
          </Card>

          <Card className="p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em andamento</p>
                <p className="text-3xl font-bold">{taskStats.inProgress}</p>
              </div>
              <span className="p-3 rounded-full border bg-background">
                <Clock className="w-5 h-5 text-warning" />
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Execuções atuais</p>
          </Card>

          <Card className="p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-3xl font-bold">{taskStats.pending}</p>
              </div>
              <span className="p-3 rounded-full border bg-background">
                <Circle className="w-5 h-5 text-muted-foreground" />
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Backlog imediato</p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-12">
          <Card className="p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Nova Tarefa</h2>
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
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Tarefa
              </Button>
            </form>
          </Card>

          <Card className="p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Fluxo de Edição</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Clique em "Editar" em qualquer tarefa para abrir um pop-up com todas as informações da atividade.
            </p>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-lg border border-border p-4 bg-background/50">
                <p className="font-medium text-foreground">Como funciona:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Abra o modal e atualize título, descrição, status e prioridade.</li>
                  <li>Use o filtro por prioridade para encontrar tarefas mais rápido.</li>
                  <li>Finalize clicando em "Salvar alterações" no pop-up.</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="font-medium text-foreground">Dica</p>
                <p className="mt-1">Você pode fechar o pop-up a qualquer momento sem perder os dados existentes.</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Tarefas ({filteredTasks.length})</h2>
              <p className="text-sm text-muted-foreground">Acompanhe o progresso e mantenha o time alinhado</p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <div className="text-xs text-muted-foreground flex flex-wrap gap-4">
                <span>Concluídas: {taskStats.completed}</span>
                <span>Em andamento: {taskStats.inProgress}</span>
                <span>Pendentes: {taskStats.pending}</span>
              </div>
              <div className="w-full md:w-64">
                <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as "all" | "low" | "medium" | "high")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as prioridades</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredTasks.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Nenhuma tarefa encontrada para este filtro</p>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card key={task.id} className="p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(task.status)}
                        <div>
                          <h3 className="text-xl font-semibold">{task.title}</h3>
                          <p className="text-xs text-muted-foreground">Atualizada em {formatDate(task.updated_at)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditTask(task)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-muted-foreground">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          {task.status === "completed" ? "Concluída" : task.status === "in_progress" ? "Em Andamento" : "Pendente"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Criada em {formatDate(task.created_at)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar tarefa</DialogTitle>
              <DialogDescription>Atualize as informações e confirme para manter tudo sincronizado.</DialogDescription>
            </DialogHeader>
            {editingTask && (
              <form onSubmit={updateTask} className="space-y-4">
                <Input
                  placeholder="Título da tarefa"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
                <Textarea
                  placeholder="Descrição (opcional)"
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeEditDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar alterações</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Dashboard;
