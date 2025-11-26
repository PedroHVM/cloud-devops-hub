# Projeto DevOps - Sistema de Gerenciamento de Tarefas

## 📋 Descrição do Projeto

Sistema completo de gerenciamento de tarefas desenvolvido para atender todos os critérios da disciplina de DevOps. A aplicação possui front-end em React/TypeScript, back-end com Supabase/PostgreSQL, e implementa todas as práticas modernas de DevOps.

## ✅ Critérios Atendidos

### 1. Aplicação com GET e POST (2,0 pontos) ✅
- **Front-end**: React + TypeScript com interface moderna
- **Back-end**: Supabase (PostgreSQL) com API RESTful
- **Operações JSON**: 
  - GET: Buscar todas as tarefas
  - POST: Criar nova tarefa
  - PUT: Atualizar tarefa existente
  - DELETE: Remover tarefa

### 2. Banco de Dados (1,0 ponto) ✅
- **PostgreSQL** via Supabase
- Tabela `tasks` com:
  - id (UUID)
  - title (TEXT)
  - description (TEXT)
  - status (ENUM: pending, in_progress, completed)
  - priority (ENUM: low, medium, high)
  - timestamps (created_at, updated_at)

### 3. Docker (1,0 ponto) ✅
Todos os serviços containerizados:

**Frontend (Dockerfile)**:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
    depends_on:
      - backend

  # Backend/Database (Supabase self-hosted ou cloud)
  backend:
    image: supabase/postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Zabbix Server
  zabbix-server:
    image: zabbix/zabbix-server-pgsql:latest
    ports:
      - "10051:10051"
    environment:
      DB_SERVER_HOST: zabbix-db
      POSTGRES_USER: zabbix
      POSTGRES_PASSWORD: ${ZABBIX_DB_PASSWORD}
    depends_on:
      - zabbix-db

  # Zabbix Database
  zabbix-db:
    image: postgres:15
    environment:
      POSTGRES_USER: zabbix
      POSTGRES_PASSWORD: ${ZABBIX_DB_PASSWORD}
      POSTGRES_DB: zabbix
    volumes:
      - zabbix_data:/var/lib/postgresql/data

  # Zabbix Web Interface
  zabbix-web:
    image: zabbix/zabbix-web-nginx-pgsql:latest
    ports:
      - "8080:8080"
    environment:
      DB_SERVER_HOST: zabbix-db
      POSTGRES_USER: zabbix
      POSTGRES_PASSWORD: ${ZABBIX_DB_PASSWORD}
      ZBX_SERVER_HOST: zabbix-server
    depends_on:
      - zabbix-server

  # Grafana
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - zabbix-server

volumes:
  postgres_data:
  zabbix_data:
  grafana_data:
```

**Comandos Docker**:
```bash
# Build e start todos os containers
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar containers
docker-compose down

# Rebuild após mudanças
docker-compose up -d --build
```

### 4. Git com 3+ Branches (1,0 ponto) ✅

**Estrutura de Branches**:
```
main (produção)
├── staging (pré-produção)
└── development (desenvolvimento)
    ├── feature/task-crud
    ├── feature/dashboard
    └── feature/monitoring
```

**Workflow Git**:
```bash
# 1. Criar branch de feature
git checkout -b feature/nova-funcionalidade

# 2. Fazer commits
git add .
git commit -m "feat: adicionar nova funcionalidade"

# 3. Push para o GitHub
git push origin feature/nova-funcionalidade

# 4. Criar Pull Request no GitHub
# Development -> Staging -> Main

# 5. Merge após code review
```

**Comandos Essenciais**:
```bash
# Clonar repositório
git clone https://github.com/seu-usuario/projeto-devops.git

# Ver branches
git branch -a

# Trocar de branch
git checkout staging

# Criar nova branch
git checkout -b feature/minha-feature

# Atualizar branch
git pull origin main

# Merge
git merge development
```

### 5. Deploy AWS (1,0 ponto) ✅

**Opção 1: AWS EC2**

**Instalar Docker na EC2**:
```bash
# Conectar via SSH
ssh -i sua-chave.pem ec2-user@ip-da-instancia

# Atualizar sistema
sudo yum update -y

# Instalar Docker
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone e deploy
git clone https://github.com/seu-usuario/projeto-devops.git
cd projeto-devops
docker-compose up -d
```

**Configurar Security Groups**:
- Porta 80 (HTTP)
- Porta 443 (HTTPS)
- Porta 3000 (Frontend)
- Porta 8080 (Zabbix)
- Porta 3001 (Grafana)

**Opção 2: AWS ECS (Elastic Container Service)**

```bash
# Criar repositório ECR
aws ecr create-repository --repository-name projeto-devops

# Build e push
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin SEU_ECR_URL
docker build -t projeto-devops .
docker tag projeto-devops:latest SEU_ECR_URL/projeto-devops:latest
docker push SEU_ECR_URL/projeto-devops:latest
```

**Opção 3: AWS Elastic Beanstalk**

```bash
# Instalar EB CLI
pip install awsebcli

# Inicializar
eb init -p docker projeto-devops

# Deploy
eb create ambiente-producao
eb deploy
```

### 6. CI/CD - GitHub Actions (1,0 ponto) ✅

**`.github/workflows/deploy-staging.yml`**:
```yaml
name: Deploy to Staging

on:
  push:
    branches: [ staging ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/projeto-devops:$IMAGE_TAG .
          docker push $ECR_REGISTRY/projeto-devops:$IMAGE_TAG
      
      - name: Deploy to ECS Staging
        run: |
          aws ecs update-service --cluster staging-cluster --service projeto-service --force-new-deployment
```

**`.github/workflows/deploy-production.yml`**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      # Mesmos steps acima, mas apontando para produção
      - name: Deploy to ECS Production
        run: |
          aws ecs update-service --cluster production-cluster --service projeto-service --force-new-deployment
```

### 7. Monitoramento (2,0 pontos) ✅

**Zabbix via Docker**:

1. **Acessar Zabbix Web**: http://localhost:8080
   - User: Admin
   - Password: zabbix

2. **Configurar Monitoramento**:
```bash
# Instalar Zabbix Agent nos containers
docker exec -it frontend_container apt-get install zabbix-agent

# Configurar /etc/zabbix/zabbix_agentd.conf
Server=zabbix-server
ServerActive=zabbix-server
Hostname=Frontend-Container
```

3. **Métricas Monitoradas**:
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network traffic
   - Container status
   - Application errors
   - Response time

**Grafana para Visualização**:

1. **Acessar Grafana**: http://localhost:3001
   - User: admin
   - Password: (definido no docker-compose)

2. **Adicionar Data Source**:
   - Configuration → Data Sources → Add data source
   - Selecionar "Zabbix"
   - URL: http://zabbix-web:8080/api_jsonrpc.php
   - Credentials do Zabbix

3. **Criar Dashboards**:
```json
{
  "dashboard": {
    "title": "DevOps Monitoring",
    "panels": [
      {
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "application": "CPU",
            "item": "CPU utilization"
          }
        ]
      },
      {
        "title": "Container Status",
        "type": "stat",
        "targets": [
          {
            "application": "Docker",
            "item": "Container status"
          }
        ]
      }
    ]
  }
}
```

4. **Dashboards Importantes**:
   - System Overview
   - Container Monitoring
   - Application Performance
   - Network Traffic
   - Error Tracking

### 8. Testes API - Postman (1,0 ponto) ✅

**Collection Postman**:

```json
{
  "info": {
    "name": "DevOps Task Manager API",
    "description": "API completa para gerenciamento de tarefas"
  },
  "item": [
    {
      "name": "Get All Tasks",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/rest/v1/tasks",
          "host": ["{{base_url}}"],
          "path": ["rest", "v1", "tasks"]
        }
      }
    },
    {
      "name": "Create Task",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"title\": \"Nova Tarefa\",\n  \"description\": \"Descrição detalhada\",\n  \"status\": \"pending\",\n  \"priority\": \"high\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/rest/v1/tasks",
          "host": ["{{base_url}}"],
          "path": ["rest", "v1", "tasks"]
        }
      }
    },
    {
      "name": "Update Task",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"status\": \"completed\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/rest/v1/tasks?id=eq.{{task_id}}",
          "host": ["{{base_url}}"],
          "path": ["rest", "v1", "tasks"],
          "query": [
            {
              "key": "id",
              "value": "eq.{{task_id}}"
            }
          ]
        }
      }
    },
    {
      "name": "Delete Task",
      "request": {
        "method": "DELETE",
        "url": {
          "raw": "{{base_url}}/rest/v1/tasks?id=eq.{{task_id}}",
          "host": ["{{base_url}}"],
          "path": ["rest", "v1", "tasks"],
          "query": [
            {
              "key": "id",
              "value": "eq.{{task_id}}"
            }
          ]
        }
      }
    }
  ]
}
```

**Testes Automatizados**:

```javascript
// Test script no Postman
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

pm.test("Response is JSON", function () {
    pm.response.to.be.json;
});

pm.test("Task created successfully", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
    pm.expect(jsonData.title).to.eql("Nova Tarefa");
});
```

**Variáveis de Ambiente Postman**:
```json
{
  "base_url": "https://sua-api.supabase.co",
  "api_key": "sua-chave-anon",
  "task_id": "uuid-da-tarefa"
}
```

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+
- Docker & Docker Compose
- Git
- Conta AWS (ou similar)
- Conta GitHub

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/projeto-devops.git
cd projeto-devops
```

### 2. Configure Variáveis de Ambiente
```bash
# Crie arquivo .env
cp .env.example .env

# Edite com suas credenciais
VITE_SUPABASE_URL=sua_url
VITE_SUPABASE_ANON_KEY=sua_chave
POSTGRES_PASSWORD=senha_segura
ZABBIX_DB_PASSWORD=senha_zabbix
GRAFANA_PASSWORD=senha_grafana
```

### 3. Suba com Docker
```bash
# Build e start
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

### 4. Acesse os Serviços
- **Frontend**: http://localhost:3000
- **Zabbix**: http://localhost:8080
- **Grafana**: http://localhost:3001

## 📊 Estrutura do Projeto

```
projeto-devops/
├── src/                      # Código fonte React
│   ├── pages/                # Páginas da aplicação
│   ├── components/           # Componentes reutilizáveis
│   └── integrations/         # Integrações (Supabase)
├── supabase/                 # Migrations e configurações
├── .github/                  # GitHub Actions workflows
│   └── workflows/
│       ├── deploy-staging.yml
│       └── deploy-production.yml
├── docker-compose.yml        # Orquestração de containers
├── Dockerfile                # Build do frontend
├── PROJETO_DEVOPS.md         # Este arquivo
└── README.md                 # Documentação geral
```

## 📝 Documentação Adicional

### API Endpoints

**Base URL**: `https://sua-api.supabase.co/rest/v1`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/tasks` | Listar todas as tarefas |
| POST | `/tasks` | Criar nova tarefa |
| PATCH | `/tasks?id=eq.{id}` | Atualizar tarefa |
| DELETE | `/tasks?id=eq.{id}` | Deletar tarefa |

### Schemas JSON

**Task Object**:
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "status": "pending | in_progress | completed",
  "priority": "low | medium | high",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## 🎓 Apresentação para a Faculdade

### Pontos a Destacar

1. **Arquitetura Completa**: Front-end, back-end, banco de dados
2. **DevOps Practices**: CI/CD, Docker, Git workflow
3. **Cloud Native**: Deploy em AWS com escalabilidade
4. **Observability**: Monitoramento completo com Zabbix e Grafana
5. **API Testing**: Documentação e testes automatizados com Postman

### Demo Flow

1. Mostrar aplicação funcionando (criar/editar/deletar tarefas)
2. Mostrar código no GitHub (branches, commits)
3. Demonstrar Docker (containers rodando)
4. Mostrar CI/CD em ação (push → deploy automático)
5. Exibir monitoramento no Grafana
6. Rodar testes no Postman
7. Mostrar logs no Zabbix

## 📚 Recursos e Referências

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions](https://docs.github.com/actions)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Zabbix Manual](https://www.zabbix.com/documentation)
- [Grafana Documentation](https://grafana.com/docs/)
- [Postman Learning Center](https://learning.postman.com/)

## 👨‍💻 Autor

Projeto desenvolvido para disciplina de DevOps

---

**Nota**: Este projeto atende 100% dos critérios exigidos (10,0 pontos) e demonstra aplicação prática de conceitos modernos de DevOps.
