# Guia Hóspede

Solução para **gerenciamento de imóveis de hospedagem** com **guia de
experiências gerado por IA**. O repositório contém **dois projetos**:

| Parte                 | Local                        | Stack                                    | Documentação                              |
| --------------------- | ---------------------------- | ---------------------------------------- | ----------------------------------------- |
| **API (backend)**     | raiz deste repositório       | NestJS · Prisma · PostgreSQL · Swagger   | este README                               |
| **Painel (frontend)** | [`frontend/`](frontend/)     | React · Vite · TypeScript · Tailwind     | [frontend/README.md](frontend/README.md)  |

A API expõe endpoints REST (GET/POST/PUT) para os imóveis e, a cada criação ou
edição, um **agente de IA** consulta uma LLM (via OpenRouter) para gerar e
persistir um guia contextualizado do bairro/cidade. O painel consome essa API.

### Arquitetura

```
Navegador ──▶ Frontend (React/Vite :5173) ──HTTP/JSON──▶ API (NestJS :3000) ──▶ PostgreSQL
                                                              │
                                                              └─ Agente IA ──▶ OpenRouter (LLM)
```

### Início rápido (os dois juntos)

```bash
# 1) API + banco de dados (Docker)
docker compose up --build            # http://localhost:3000  ·  Swagger em /docs

# 2) Painel (em outro terminal)
cd frontend && npm install && npm run dev   # http://localhost:5173
```

> Detalhes do painel: [frontend/README.md](frontend/README.md).
> O restante deste documento descreve a **API (backend)**.

> 🚀 **Deploy público (gratuito)** com Neon + Render + Vercel: veja
> [DEPLOY.md](DEPLOY.md).

---

## 🧱 Stack

| Camada         | Tecnologia                          |
| -------------- | ----------------------------------- |
| Runtime        | Node.js 20                          |
| Framework      | NestJS 10 (Express)                 |
| Linguagem      | TypeScript 5                        |
| ORM            | Prisma 5                            |
| Banco de dados | PostgreSQL 16                       |
| Validação      | class-validator / class-transformer |
| Documentação   | @nestjs/swagger (OpenAPI 3)         |
| Testes         | Jest + ts-jest                      |
| Containers     | Docker + Docker Compose             |

---

## 📁 Estrutura do repositório

```
.
├── prisma/
│   ├── schema.prisma          # Modelo de dados (normalizado)
│   └── seed.ts                # Popula o imóvel de exemplo (FLN001)
├── src/
│   ├── main.ts                # Bootstrap + Swagger + CORS
│   ├── app.module.ts
│   ├── health/                # Endpoint de health check
│   ├── prisma/                # PrismaService + PrismaModule (global)
│   ├── properties/            # CRUD de imóveis (controller/service/dto/mapper)
│   └── guidebook/             # Agente de IA + guidebook (LLM, service, listener)
├── frontend/                  # 👉 Painel React (SPA) — ver frontend/README.md
├── Dockerfile                 # Build multi-stage
├── docker-compose.yml         # API + PostgreSQL
├── docker-entrypoint.sh       # Aplica schema e sobe a API
└── .env.example
```

---

## 🚀 Como iniciar

### Opção A — Docker (recomendado, sobe tudo)

Pré-requisitos: **Docker** e **Docker Compose**.

```bash
docker compose up --build
```

Isso irá:

1. Subir um container **PostgreSQL 16**;
2. Buildar e subir a **API**;
3. Aplicar o schema no banco automaticamente (via `prisma db push`);
4. Deixar a API disponível.

- API: <http://localhost:3000/api>
- Swagger: <http://localhost:3000/docs>

Para popular o banco com o imóvel de exemplo (`FLN001`), use a própria API
(veja o `curl` de exemplo mais abaixo) ou rode o seed a partir da máquina
local apontando para o banco do container:

```bash
DATABASE_URL="postgresql://guiahospede:guiahospede@localhost:5432/guiahospede?schema=public" npm run db:seed
```

Para parar e remover os containers:

```bash
docker compose down          # mantém os dados
docker compose down -v       # remove também o volume do banco
```

### Opção B — Ambiente local

Pré-requisitos: **Node.js 20+** e um **PostgreSQL** acessível.

```bash
# 1. Instalar dependências (gera o Prisma Client automaticamente)
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite o DATABASE_URL conforme o seu PostgreSQL

# 3. Criar as tabelas no banco (cria a migration inicial)
npm run prisma:migrate -- --name init

# 4. (opcional) Popular com o imóvel de exemplo
npm run db:seed

# 5. Subir a API em modo desenvolvimento (hot reload)
npm run start:dev
```

> Precisa de um PostgreSQL rápido? Suba só o banco com Docker e rode a API local:
>
> ```bash
> docker compose up -d db
> ```

---

## 📚 Documentação (Swagger)

Com a API no ar, acesse:

```
http://localhost:3000/docs
```

Lá é possível visualizar todos os endpoints, os schemas de entrada/saída e
executar chamadas diretamente pelo navegador. O JSON do OpenAPI fica em
`http://localhost:3000/docs-json`.

---

## 🔌 Endpoints

Todos sob o prefixo `/api`.

| Método | Rota                | Descrição                          |
| ------ | ------------------- | ---------------------------------- |
| `POST` | `/api/properties`     | Cadastra um novo imóvel            |
| `GET`  | `/api/properties`     | Lista todos os imóveis             |
| `GET`  | `/api/properties/:id` | Busca um imóvel pelo `id` (UUID)   |
| `PUT`  | `/api/properties/:id` | Atualiza um imóvel existente       |
| `GET`  | `/api/properties/:id/guidebook`         | Retorna o guia de experiências (gera sob demanda se não existir) |
| `POST` | `/api/properties/:id/guidebook/refresh` | Regenera o guia via IA             |
| `GET`  | `/api/health`         | Health check                       |

### Exemplo — criar um imóvel

```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -d '{
    "code": "FLN001",
    "name": "Apartamento Beira-Mar Florianópolis",
    "property_type": "Apartamento",
    "bedroom_quantity": 2,
    "bathroom_quantity": 1,
    "guest_capacity": 4,
    "address": {
      "street": "Rua Lauro Linhares",
      "number": "589",
      "complement": "Apto 301",
      "neighborhood": "Trindade",
      "city": "Florianópolis",
      "state": "SC",
      "postal_code": "88036-001"
    },
    "operational": {
      "wifi_network": "SeaHome_FLN001",
      "wifi_password": "floripa2024",
      "is_self_checkin": true,
      "property_access_type": "smart_lock",
      "property_access_instructions": "Use o código 4521 na fechadura eletrônica",
      "property_password": "4521",
      "has_parking_spot": true,
      "parking_spot_identifier": "Vaga 12 — subsolo B1",
      "parking_spot_instructions": "Portão lateral, código 7890 no interfone"
    },
    "rules": {
      "check_in_time": "15:00",
      "check_out_time": "11:00",
      "allow_pet": false,
      "smoking_permitted": false,
      "suitable_for_children": true,
      "suitable_for_babies": true,
      "events_permitted": false
    },
    "amenities": {
      "wifi": true,
      "tv": true,
      "air_conditioning": true,
      "kitchen": true,
      "washing_machine": true,
      "elevator": true,
      "balcony": true
    },
    "images": [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"
    ],
    "host": {
      "name": "Ana Paula",
      "phone": "+5548991234567"
    }
  }'
```

A resposta inclui o mesmo objeto acrescido de `id`, `created_at` e
`updated_at`.

### Exemplo — atualizar (PUT)

O `PUT` aceita atualização parcial: envie apenas os campos que deseja alterar.
Sub-objetos enviados (`address`, `operational`, etc.) substituem o registro
correspondente.

```bash
curl -X PUT http://localhost:3000/api/properties/<id> \
  -H "Content-Type: application/json" \
  -d '{ "name": "Apartamento Beira-Mar (reformado)", "guest_capacity": 5 }'
```

---

## 🤖 Guia de experiências gerado por IA

Ao **criar** ou **editar** um imóvel, um **agente de IA** entra em ação: ele
captura o endereço do imóvel, monta um prompt contextualizado e consulta uma
LLM (via **OpenRouter**) para gerar um guia de experiências do bairro/cidade,
que é **persistido** no banco (tabela `guidebooks`).

O guia contém:

- **Mensagem de boas-vindas** personalizada para o imóvel;
- **Restaurantes próximos** (4–5 opções reais, com nome, distância e descrição);
- **Atrações próximas** (3–4 opções reais);
- **Serviços essenciais** (farmácia, supermercado, hospital próximos);
- **Dica sazonal** relevante para a época atual do ano.

### Como funciona (arquitetura)

```
POST/PUT /properties  ──▶  PropertiesService  ──emite evento──▶  EventEmitter2
                                                                      │
                                                                      ▼
                                                     GuidebookListener (assíncrono)
                                                                      │
                                                                      ▼
   GuidebookAgentService  ──monta prompt do endereço──▶  OpenRouterService  ──▶  LLM
                                                                      │
                                                                      ▼
                                            parse do JSON + persistência (Guidebook)
```

- A geração é **assíncrona** (via `@nestjs/event-emitter`): não bloqueia nem
  falha a criação/edição do imóvel se a LLM estiver indisponível.
- Como **fallback**, o `GET .../guidebook` também gera o guia **sob demanda**
  no primeiro acesso, caso ele ainda não exista.
- O `POST .../guidebook/refresh` força uma nova geração (útil após mudança de
  endereço ou para atualizar a dica sazonal).

### Configuração

Defina no `.env` (veja `.env.example`):

| Variável              | Descrição                                        |
| --------------------- | ------------------------------------------------ |
| `OPENROUTER_API_KEY`  | Chave da API do OpenRouter (obrigatória)         |
| `LLM_MODEL`           | Modelo (o prefixo `openrouter:` é ignorado)      |
| `OPENROUTER_BASE_URL` | Base URL (`https://openrouter.ai/api/v1`)        |

> **Nota sobre modelos `:free`.** Modelos gratuitos do OpenRouter (ex.:
> `openai/gpt-oss-120b:free`) têm limite de taxa agressivo e frequentemente
> retornam **HTTP 429** (`temporarily rate-limited upstream`). Nesse caso a API
> responde 429 com uma mensagem clara e **não quebra** — basta tentar novamente
> mais tarde, adicionar créditos à conta ou apontar `LLM_MODEL` para um modelo
> pago. O código funciona igual para qualquer modelo compatível do OpenRouter.

### Exemplo — obter o guia

```bash
curl http://localhost:3000/api/properties/<id>/guidebook
```

```jsonc
{
  "property_id": "…",
  "welcome_message": "Seu apartamento fica no coração da Trindade…",
  "restaurants": [
    { "name": "Box 32", "distance": "Aprox. 1,2 km", "description": "Boteco tradicional…" }
  ],
  "attractions": [
    { "name": "Praia da Joaquina", "distance": "Aprox. 18 km", "description": "Dunas e surf." }
  ],
  "essentials": [
    { "name": "Farmácia Catarinense", "type": "pharmacy", "distance": "Aprox. 300 m", "description": "24h." }
  ],
  "seasonal_tips": "Em julho as temperaturas ficam entre 12°C e 20°C. Leve um agasalho.",
  "model": "openai/gpt-oss-120b:free",
  "generated_at": "2026-07-11T12:00:00.000Z"
}
```

---

## 🗃️ Modelo de dados

O imóvel (`Property`) é normalizado em tabelas relacionadas 1:1:

- `addresses` — endereço completo
- `operational_info` — WiFi, acesso, estacionamento
- `stay_rules` — horários e políticas
- `amenities` — amenidades (booleanos)
- `hosts` — contato do anfitrião

As fotos ficam em `images` (array nativo de strings do PostgreSQL). O `code`
do imóvel é único; tentar cadastrar um código repetido retorna **409 Conflict**.

Para inspecionar o banco visualmente:

```bash
npm run prisma:studio
```

---

## 🧪 Testes

```bash
npm test              # roda os testes unitários
npm run test:watch    # modo watch
npm run test:cov      # com cobertura
```

Os testes cobrem o `PropertiesService` (regras de negócio, erros de conflito
e "não encontrado"), o `PropertiesController` (delegação) e o mapper de
conversão de dados — todos com o Prisma mockado, sem necessidade de banco.

---

## 📜 Scripts úteis

| Script                    | Descrição                                        |
| ------------------------- | ------------------------------------------------ |
| `npm run start:dev`       | API com hot reload                               |
| `npm run build`           | Compila para `dist/`                             |
| `npm run start:prod`      | Roda a versão compilada                          |
| `npm run prisma:migrate`  | Cria/aplica migrations em desenvolvimento        |
| `npm run prisma:deploy`   | Aplica migrations (produção)                     |
| `npm run prisma:studio`   | Abre o Prisma Studio                             |
| `npm run db:seed`         | Popula o imóvel de exemplo                       |
| `npm test`                | Testes unitários                                 |
| `npm run lint`            | ESLint                                           |

---

## ⚙️ Variáveis de ambiente

| Variável       | Descrição                                | Exemplo                                                              |
| -------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL` | String de conexão do PostgreSQL (Prisma) | `postgresql://guiahospede:guiahospede@localhost:5432/guiahospede`    |
| `PORT`         | Porta HTTP da API                        | `3000`                                                               |
