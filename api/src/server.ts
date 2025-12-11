import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { randomUUID } from "node:crypto";

dotenv.config();

// Types
interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

interface CreateTaskBody {
  title: string;
  description?: string;
  status?: Task["status"];
  priority?: Task["priority"];
}

interface UpdateTaskBody {
  title?: string;
  description?: string;
  status?: Task["status"];
  priority?: Task["priority"];
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

// App setup
const app = express();
const port = Number(process.env.PORT) || 4000;

// Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Força todas as respostas a serem JSON
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

// In-memory database
const tasks: Task[] = [
  {
    id: randomUUID(),
    title: "Planejar sprint",
    description: "Listar tarefas principais da semana",
    status: "in_progress",
    priority: "high",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    title: "Configurar monitoramento",
    description: "Criar dashboard no Grafana",
    status: "pending",
    priority: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Routes

// Health check
app.get("/health", (_req: Request, res: Response): void => {
  const response: ApiResponse<{ timestamp: string }> = {
    success: true,
    data: { timestamp: new Date().toISOString() },
  };
  res.json(response);
});

// GET all tasks
app.get("/tasks", (_req: Request, res: Response): void => {
  const response: ApiResponse<Task[]> = {
    success: true,
    data: tasks,
  };
  res.json(response);
});

// GET single task
app.get("/tasks/:id", (req: Request, res: Response): void => {
  const { id } = req.params;
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    res.status(404).json({
      success: false,
      message: "Tarefa não encontrada",
    } as ApiResponse);
    return;
  }

  res.json({
    success: true,
    data: task,
  } as ApiResponse<Task>);
});

// POST create task
app.post("/tasks", (req: Request<unknown, unknown, CreateTaskBody>, res: Response): void => {
  const { title, description = "", status = "pending", priority = "medium" } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    res.status(400).json({
      success: false,
      message: "Título é obrigatório e deve ser uma string não vazia",
    } as ApiResponse);
    return;
  }

  const validStatuses: Task["status"][] = ["pending", "in_progress", "completed"];
  const validPriorities: Task["priority"][] = ["low", "medium", "high"];

  if (!validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      message: `Status inválido. Use: ${validStatuses.join(", ")}`,
    } as ApiResponse);
    return;
  }

  if (!validPriorities.includes(priority)) {
    res.status(400).json({
      success: false,
      message: `Prioridade inválida. Use: ${validPriorities.join(", ")}`,
    } as ApiResponse);
    return;
  }

  const now = new Date().toISOString();
  const newTask: Task = {
    id: randomUUID(),
    title: title.trim(),
    description: description.trim(),
    status,
    priority,
    createdAt: now,
    updatedAt: now,
  };

  tasks.unshift(newTask);

  res.status(201).json({
    success: true,
    data: newTask,
    message: "Tarefa criada com sucesso",
  } as ApiResponse<Task>);
});

// PUT update task
app.put("/tasks/:id", (req: Request<{ id: string }, unknown, UpdateTaskBody>, res: Response): void => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex((task) => task.id === id);

  if (taskIndex === -1) {
    res.status(404).json({
      success: false,
      message: "Tarefa não encontrada",
    } as ApiResponse);
    return;
  }

  const { title, description, status, priority } = req.body;

  if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
    res.status(400).json({
      success: false,
      message: "Título deve ser uma string não vazia",
    } as ApiResponse);
    return;
  }

  const validStatuses: Task["status"][] = ["pending", "in_progress", "completed"];
  const validPriorities: Task["priority"][] = ["low", "medium", "high"];

  if (status !== undefined && !validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      message: `Status inválido. Use: ${validStatuses.join(", ")}`,
    } as ApiResponse);
    return;
  }

  if (priority !== undefined && !validPriorities.includes(priority)) {
    res.status(400).json({
      success: false,
      message: `Prioridade inválida. Use: ${validPriorities.join(", ")}`,
    } as ApiResponse);
    return;
  }

  const currentTask = tasks[taskIndex];
  const updatedTask: Task = {
    ...currentTask,
    title: title?.trim() ?? currentTask.title,
    description: description?.trim() ?? currentTask.description,
    status: status ?? currentTask.status,
    priority: priority ?? currentTask.priority,
    updatedAt: new Date().toISOString(),
  };

  tasks[taskIndex] = updatedTask;

  res.json({
    success: true,
    data: updatedTask,
    message: "Tarefa atualizada com sucesso",
  } as ApiResponse<Task>);
});

// DELETE task
app.delete("/tasks/:id", (req: Request, res: Response): void => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex((task) => task.id === id);

  if (taskIndex === -1) {
    res.status(404).json({
      success: false,
      message: "Tarefa não encontrada",
    } as ApiResponse);
    return;
  }

  const [removed] = tasks.splice(taskIndex, 1);

  res.json({
    success: true,
    data: removed,
    message: "Tarefa removida com sucesso",
  } as ApiResponse<Task>);
});

// 404 handler - rota não encontrada
app.use((_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: "Rota não encontrada",
  } as ApiResponse);
});

// Error handler global
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error("Erro:", err.message);
  res.status(500).json({
    success: false,
    message: "Erro interno do servidor",
  } as ApiResponse);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 API rodando em http://localhost:${port}`);
  console.log(`📋 Endpoints disponíveis:`);
  console.log(`   GET    /health`);
  console.log(`   GET    /tasks`);
  console.log(`   GET    /tasks/:id`);
  console.log(`   POST   /tasks`);
  console.log(`   PUT    /tasks/:id`);
  console.log(`   DELETE /tasks/:id`);
});
