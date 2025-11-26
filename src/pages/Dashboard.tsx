import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, CheckCircle2, Circle, Clock } from "lucide-react";

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
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
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
  };

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-tech-gradient bg-clip-text text-transparent">
            Dashboard de Tarefas
          </h1>
          <p className="text-muted-foreground">Sistema completo de gerenciamento com API RESTful</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
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

          {editingTask && (
            <Card className="p-6 shadow-lg border-accent">
              <h2 className="text-2xl font-semibold mb-4">Editar Tarefa</h2>
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
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Salvar</Button>
                  <Button type="button" variant="outline" onClick={() => setEditingTask(null)} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Tarefas ({tasks.length})</h2>
          <div className="grid gap-4">
            {tasks.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Nenhuma tarefa cadastrada ainda</p>
              </Card>
            ) : (
              tasks.map((task) => (
                <Card key={task.id} className="p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(task.status)}
                        <h3 className="text-xl font-semibold">{task.title}</h3>
                      </div>
                      {task.description && (
                        <p className="text-muted-foreground mb-3">{task.description}</p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          {task.status === "completed" ? "Concluída" : task.status === "in_progress" ? "Em Andamento" : "Pendente"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => setEditingTask(task)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => deleteTask(task.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
