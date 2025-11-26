import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle2, Database, Cloud, GitBranch, Container, Activity, FileCode } from "lucide-react";

const Index = () => {
  const features = [
    { icon: Database, title: "Banco de Dados", description: "PostgreSQL com CRUD completo" },
    { icon: Cloud, title: "Deploy AWS", description: "Pronto para produção na nuvem" },
    { icon: GitBranch, title: "Git Workflow", description: "3+ branches com CI/CD" },
    { icon: Container, title: "Docker", description: "Totalmente containerizado" },
    { icon: Activity, title: "Monitoramento", description: "Zabbix e Grafana" },
    { icon: FileCode, title: "API RESTful", description: "GET, POST, PUT, DELETE" },
  ];

  const requirements = [
    "Aplicação com GET e POST usando JSON (front-end + back-end)",
    "Banco de dados integrado para armazenar e alterar dados",
    "Uso de Docker para todas as partes da aplicação",
    "Git com mínimo de 3 branches no GitHub",
    "Deploy em ambiente de nuvem (AWS ou similar)",
    "CI/CD para atualização automática em Staging e Master",
    "Monitoramento com Zabbix (Docker) e Grafana",
    "Documentação e testes da API com Postman",
  ];

  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-tech-gradient bg-clip-text text-transparent animate-fade-in">
          Projeto DevOps
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Sistema de Gerenciamento de Tarefas com arquitetura completa de DevOps
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button asChild size="lg" className="shadow-lg">
            <Link to="/dashboard">
              Acessar Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              Ver no GitHub
            </a>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Características Técnicas</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-xl transition-shadow">
              <feature.icon className="w-12 h-12 mb-4 text-accent" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Requirements Checklist */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Critérios do Projeto</h2>
        <Card className="max-w-4xl mx-auto p-8 shadow-xl">
          <div className="space-y-4">
            {requirements.map((requirement, index) => (
              <div key={index} className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-1" />
                <p className="text-lg">{requirement}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Tech Stack */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Stack Tecnológica</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            { name: "React + TypeScript", desc: "Front-end moderno" },
            { name: "Supabase/PostgreSQL", desc: "Backend e database" },
            { name: "Docker", desc: "Containerização" },
            { name: "AWS", desc: "Cloud hosting" },
            { name: "GitHub Actions", desc: "CI/CD pipeline" },
            { name: "Zabbix", desc: "Monitoramento" },
            { name: "Grafana", desc: "Visualização" },
            { name: "Postman", desc: "API testing" },
          ].map((tech, index) => (
            <Card key={index} className="p-6 text-center hover:border-accent transition-colors">
              <h3 className="font-semibold text-lg mb-2">{tech.name}</h3>
              <p className="text-sm text-muted-foreground">{tech.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center border-t">
        <p className="text-muted-foreground">
          Projeto desenvolvido para disciplina de DevOps
        </p>
      </footer>
    </div>
  );
};

export default Index;
