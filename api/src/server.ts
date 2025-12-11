import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { randomUUID } from "node:crypto";

dotenv.config();

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

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

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/tasks", (_req: Request, res: Response) => {
  res.json(tasks);
});

app.post("/tasks", (req: Request, res: Response) => {
  const { title, description = "", status = "pending", priority = "medium" } = req.body;

  if (!title || typeof title !== "string") {
    return res.status(400).json({ message: "Título é obrigatório" });
  }

  const newTask: Task = {
    id: randomUUID(),
    title,
    description,
    status,
    priority,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks.unshift(newTask);
  res.status(201).json(newTask);
});

app.put("/tasks/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex((task) => task.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ message: "Tarefa não encontrada" });
  }

  const updatedTask = {
    ...tasks[taskIndex],
    ...req.body,
    updatedAt: new Date().toISOString(),
  } as Task;

  tasks[taskIndex] = updatedTask;
  res.json(updatedTask);
});

app.delete("/tasks/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex((task) => task.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ message: "Tarefa não encontrada" });
  }

  const [removed] = tasks.splice(taskIndex, 1);
  res.json(removed);
});

app.use((_req, res) => {
  res.status(404).json({ message: "Rota não encontrada" });
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
