# 🚀 BotFlow — Démarrage rapide (5 minutes)

## Prérequis
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/)

---

## Option A — Docker (recommandé, 1 commande)

```bash
# 1. Cloner
git clone https://github.com/votre-repo/botflow.git
cd botflow

# 2. Configurer les clés API (éditer le fichier)
cp BotFlow.API/appsettings.json BotFlow.API/appsettings.Production.json
# Renseigner Jwt:Secret et AI:Anthropic:ApiKey dans le fichier

# 3. Lancer tout (API + PostgreSQL + Redis + Frontend)
docker-compose up -d

# 4. Accéder à l'application
# Frontend :  http://localhost:3000
# API Swagger: http://localhost:5000/swagger
# Health:      http://localhost:5000/health
```

---

## Option B — Développement local

### 1. Base de données PostgreSQL

```bash
# Via Docker (ou utilisez votre instance locale)
docker run -d --name botflow-pg \
  -e POSTGRES_DB=botflow_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Configurer l'API

Créez `BotFlow.API/appsettings.Development.json` :
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=botflow_dev;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Secret": "dev-secret-key-minimum-32-characters-long!!"
  },
  "AI": {
    "Anthropic": { "ApiKey": "sk-ant-votre-cle-ici" },
    "Groq":      { "ApiKey": "gsk_votre-cle-ici" }
  }
}
```

### 3. Migrations EF Core

```bash
cd BotFlow.API

# Installer dotnet-ef si nécessaire
dotnet tool install --global dotnet-ef

# Appliquer les migrations (crée toutes les tables)
dotnet ef database update --project ../BotFlow.Infrastructure
```

### 4. Lancer le backend

```bash
# Depuis la racine du projet
dotnet run --project BotFlow.API

# API disponible sur:
# http://localhost:5000
# https://localhost:5001
# Swagger: http://localhost:5000/swagger
```

### 5. Lancer le frontend

```bash
cd botflow-frontend

# Créer le fichier d'environnement
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
echo "NEXT_PUBLIC_WS_URL=http://localhost:5000"  >> .env.local

# Installer les dépendances
npm install

# Démarrer en développement
npm run dev

# Frontend disponible sur: http://localhost:3000
```

---

## Premier test : Créer un compte

### Via Swagger UI : http://localhost:5000/swagger

**POST /api/auth/register**
```json
{
  "tenantName":  "Ma Société",
  "tenantSlug":  "ma-societe",
  "email":       "admin@masociete.com",
  "password":    "MonMotDePasse123!",
  "firstName":   "Jean",
  "lastName":    "Dupont"
}
```

**Réponse :**
```json
{
  "accessToken":  "eyJhbG...",
  "refreshToken": "abc123...",
  "user": { "id": "...", "role": "admin" },
  "tenant": { "id": "...", "slug": "ma-societe" }
}
```

### Créer un chatbot

**POST /api/chatbots** (avec le Bearer token)
```json
{
  "name":           "Support Client",
  "channel":        "webchat",
  "welcomeMessage": "Bonjour ! Comment puis-je vous aider ?",
  "systemPrompt":   "Tu es un assistant support pour Ma Société. Réponds en français de manière professionnelle."
}
```

### Intégrer le widget sur votre site

```html
<!-- Coller avant </body> -->
<script
  src="http://localhost:5000/widget/widget.js"
  data-tenant-id="VOTRE_TENANT_ID"
  data-bot-id="VOTRE_BOT_ID"
  data-theme="#6C63FF"
  data-lang="fr"
  data-api-url="http://localhost:5000"
  async>
</script>
```

---

## Architecture & choix techniques

| Composant | Technologie | Pourquoi |
|-----------|-------------|----------|
| **API** | ASP.NET Core 8 | Haute performance, Clean Architecture |
| **ORM** | EF Core 8 + Npgsql | Migration type-safe, jsonb support |
| **Auth** | JWT + Refresh tokens | Stateless, multi-tenant |
| **Real-time** | SignalR | WebSocket avec fallback SSE/LongPolling |
| **Multi-tenant** | EF Core Global Query Filters + RLS PostgreSQL | Double isolation (app + DB) |
| **AI** | Anthropic/Groq/Gemini | Fallback automatique si provider down |
| **Frontend** | Next.js 14 App Router | SSR, TypeScript, performance |
| **State** | Zustand + localStorage | Auth persistée entre sessions |
| **Widget** | Vanilla JS (0 deps runtime) | Compatible tous sites, <15KB |
| **Deploy** | Docker + GitHub Actions | CI/CD automatique |

---

## Variables d'environnement (production)

```bash
# Obligatoires
ConnectionStrings__DefaultConnection=Host=postgres;Database=botflow;Username=...
Jwt__Secret=VOTRE_SECRET_MINIMUM_32_CARACTERES_EN_PROD

# Clés IA (au moins une requise)
AI__Anthropic__ApiKey=sk-ant-...
AI__Groq__ApiKey=gsk_...
AI__Gemini__ApiKey=...

# CORS
Cors__AllowedOrigins__0=https://app.votredomaine.com
Cors__AllowedOrigins__1=https://votresite.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.votredomaine.com
NEXT_PUBLIC_WS_URL=https://api.votredomaine.com
```

---

## Roadmap

### Version 1.0 (MVP — FAIT ✓)
- [x] Architecture multi-tenant (EF Core + RLS)
- [x] Auth JWT (register, login, refresh)
- [x] CRUD Chatbots, FlowNodes, KnowledgeBase
- [x] SignalR temps réel
- [x] AI Router (Claude → Groq → Gemini)
- [x] Flow Engine (règles → IA → escalade)
- [x] Widget JS embarquable
- [x] Dashboard Next.js 14
- [x] Docker + CI/CD GitHub Actions

### Version 1.1 (Prochaine)
- [ ] Génération de migration EF Core automatique (`dotnet ef migrations add`)
- [ ] Tests unitaires (xUnit) + tests d'intégration
- [ ] Rate limiting par tenant (Redis + `AspNetCoreRateLimit`)
- [ ] Envoi d'emails (SendGrid) pour vérification et notifications
- [ ] Upload de fichiers PDF dans la base de connaissances (RAG)

### Version 1.2
- [ ] Stripe pour abonnements (webhooks + portail client)
- [ ] Intégration WhatsApp Business API (Meta Cloud API)
- [ ] Intégration Facebook Messenger
- [ ] Export des conversations (CSV/Excel)
- [ ] Tableau de bord super-admin (gestion tenants)

### Version 2.0
- [ ] RAG (Retrieval-Augmented Generation) avec pgvector
- [ ] Éditeur drag-and-drop avancé (nœuds complexes, tests A/B)
- [ ] Intégrations CRM (HubSpot, Salesforce)
- [ ] API publique documentée (OpenAPI 3.1)
- [ ] Application mobile agent (React Native)
