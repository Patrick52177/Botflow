# BotFlow — Plateforme SaaS Chatbot Multi-Tenant

## Stack technique
- **Backend** : ASP.NET Core 8 Web API (Clean Architecture)
- **Base de données** : PostgreSQL 16 + Entity Framework Core 8
- **Real-time** : SignalR (WebSocket)
- **Auth** : JWT (Access Token 60min + Refresh Token 30j)
- **IA** : Claude (Anthropic), Groq (LLaMA 3), Gemini (Google) avec fallback automatique
- **Frontend** : Next.js 14 + TypeScript + TailwindCSS
- **Cache** : Redis
- **Déploiement** : Docker + Docker Compose

---

## Architecture
```
BotFlow/
├── BotFlow.Domain/          # Entités, interfaces domaine (aucune dépendance)
│   └── Entities/            # Tenant, User, Chatbot, FlowNode, Conversation, Message...
├── BotFlow.Application/     # DTOs, interfaces services, logique métier abstraite
│   ├── DTOs/
│   └── Interfaces/          # IAuthService, IChatbotService, IAiService...
├── BotFlow.Infrastructure/  # Implémentation concrète (EF Core, JWT, AI APIs)
│   ├── Data/                # AppDbContext (global query filters multi-tenant)
│   └── Services/            # AuthService, ChatbotService, AiService, FlowEngineService...
├── BotFlow.API/             # Controllers REST, SignalR Hub, Middleware
│   ├── Controllers/         # AuthController, ChatbotsController, ConversationsController
│   ├── Hubs/                # ChatHub (SignalR)
│   └── Middleware/          # ErrorHandlingMiddleware
├── botflow-frontend/        # Next.js 14 (voir étape 5)
└── docker-compose.yml
```

---

## Démarrage rapide

### Prérequis
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [PostgreSQL 16](https://www.postgresql.org/) (ou via Docker)

### 1. Cloner et configurer

```bash
git clone https://github.com/votre-repo/botflow.git
cd botflow
```

Copiez et éditez la config :
```bash
cp BotFlow.API/appsettings.json BotFlow.API/appsettings.Development.json
```

Renseignez dans `appsettings.Development.json` :
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=botflow_dev;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Secret": "votre-secret-min-32-caracteres-!!"
  },
  "AI": {
    "Anthropic": { "ApiKey": "sk-ant-..." },
    "Groq":      { "ApiKey": "gsk_..." }
  }
}
```

### 2. Lancer avec Docker (recommandé)

```bash
docker-compose up -d
```

L'API sera disponible sur `http://localhost:5000`  
Swagger UI : `http://localhost:5000/swagger`

### 3. Lancer manuellement

**Base de données :**
```bash
# Avec Docker
docker run -d --name botflow-pg \
  -e POSTGRES_DB=botflow_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:16-alpine
```

**Migrations EF Core :**
```bash
cd BotFlow.API
dotnet ef database update --project ../BotFlow.Infrastructure
```

**Lancer l'API :**
```bash
dotnet run --project BotFlow.API
```

**Frontend :**
```bash
cd botflow-frontend
npm install
npm run dev
```

---

## API Endpoints

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Créer tenant + admin |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/refresh` | Renouveler token |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Profil utilisateur |

### Chatbots
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/chatbots` | Lister les bots |
| POST | `/api/chatbots` | Créer un bot |
| PATCH | `/api/chatbots/{id}` | Modifier |
| DELETE | `/api/chatbots/{id}` | Supprimer |
| GET | `/api/chatbots/{id}/flow` | Récupérer le flux |
| PUT | `/api/chatbots/{id}/flow` | Sauvegarder le flux |
| GET | `/api/chatbots/{id}/knowledge` | Base de connaissances |
| GET | `/api/chatbots/{id}/embed` | Script d'intégration |

### Conversations
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/conversations` | Lister |
| GET | `/api/conversations/{id}` | Détail |
| POST | `/api/conversations` | Créer (widget) |
| PATCH | `/api/conversations/{id}/escalate` | Escalader |
| PATCH | `/api/conversations/{id}/resolve` | Résoudre |
| GET | `/api/conversations/analytics` | Analytiques |

### WebSocket (SignalR)
```
ws://localhost:5000/hubs/chat
```
Événements client → serveur :
- `JoinConversation(conversationId)`
- `SendMessage(conversationId, tenantId, chatbotId, content)`
- `AgentSendMessage(conversationId, tenantId, content)`
- `TypingIndicator(conversationId, isTyping)`

Événements serveur → client :
- `MessageReceived(message)`
- `BotTyping(conversationId, bool)`
- `ConversationEscalated(conversationId)`
- `ConversationResolved(conversationId)`

---

## Architecture multi-tenant

L'isolation des tenants est assurée par **EF Core Global Query Filters** :

```csharp
// Automatiquement appliqué à TOUTES les requêtes
modelBuilder.Entity<Chatbot>().HasQueryFilter(e =>
    !e.IsDeleted && e.TenantId == _currentTenantId);
```

Le `TenantId` est extrait du claim JWT `tenant_id` via `HttpTenantContext`  
→ Chaque requête est automatiquement scopée au tenant de l'utilisateur connecté.

---

## Logique AI Router (FlowEngineService)

```
Message utilisateur
        ↓
1. Chercher dans KnowledgeBase (mots-clés)
        ↓ (pas de match)
2. Chercher dans FlowNodes (conditions)
        ↓ (pas de match)
3. Appeler AI Provider (Claude → Groq → Gemini)
        ↓
4. Si confidence < seuil → escalader vers agent humain
```

---

## Variables d'environnement (production)

```bash
ConnectionStrings__DefaultConnection=Host=...
Jwt__Secret=votre-secret-production-min-32-chars
AI__Anthropic__ApiKey=sk-ant-...
AI__Groq__ApiKey=gsk_...
AI__Gemini__ApiKey=...
Cors__AllowedOrigins__0=https://app.votredomaine.com
```

---

## Prochaines étapes (Roadmap)

- [ ] Migration EF Core initiale
- [ ] Frontend Next.js 14 (Étape 5)
- [ ] Widget JavaScript embarquable (Étape 6)
- [ ] Stripe pour abonnements
- [ ] Intégration WhatsApp Business API
- [ ] Rate limiting par tenant (Redis)
- [ ] Système d'emails (SendGrid)
- [ ] Tests unitaires + intégration (xUnit)
