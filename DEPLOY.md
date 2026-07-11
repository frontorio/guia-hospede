# Deploy (gratuito): Neon + Render + Vercel

Guia para colocar o projeto no ar com uma URL pública, usando planos gratuitos.

- **Banco:** Neon (PostgreSQL serverless)
- **API:** Render (Docker, a partir do `Dockerfile`)
- **Frontend:** Vercel (Vite/React)

> **Pré-requisito:** o repositório precisa estar no GitHub e **atualizado**
> (`git push`), pois as três plataformas fazem deploy a partir dele.

> **Ordem importa** por causa das URLs: primeiro o banco, depois a API (que
> precisa do banco), depois o frontend (que precisa da URL da API) e, por fim,
> voltamos à API para liberar o CORS do domínio do frontend.

---

## 1) Banco de dados — Neon

1. Crie uma conta em <https://neon.com> e um **projeto** (região mais próxima).
2. Em **Connection Details**, copie a **connection string** (formato):
   ```
   postgresql://USUARIO:SENHA@ep-xxxx.sa-east-1.aws.neon.tech/neondb?sslmode=require
   ```
   Guarde-a — será o `DATABASE_URL` da API. (O `?sslmode=require` é obrigatório.)

---

## 2) API — Render (Docker)

1. Crie conta em <https://render.com> e conecte sua conta do GitHub.
2. **New → Blueprint** e selecione este repositório. O Render lê o
   [`render.yaml`](render.yaml) e cria o serviço `guia-hospede-api` (Docker, free).
   - _Alternativa manual:_ **New → Web Service** → runtime **Docker** →
     `Dockerfile` na raiz → plano **Free** → Health Check Path `/api/health`.
3. Em **Environment**, defina as variáveis:
   | Variável | Valor |
   | --- | --- |
   | `DATABASE_URL` | a string do Neon (passo 1) |
   | `OPENROUTER_API_KEY` | sua chave do OpenRouter |
   | `LLM_MODEL` | `nvidia/nemotron-3-ultra-550b-a55b:free` (ou outro) |
   | `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
   | `LLM_MAX_TOKENS` | `6000` (teto de tokens; evita cortar o guia) |
   | `CORS_ORIGIN` | deixe `*` **por enquanto** (ajustamos no passo 4) |
   > **Não** defina `PORT` — o Render injeta automaticamente e a API já o lê.
4. Aguarde o build (a imagem Docker leva alguns minutos). No boot, o
   `docker-entrypoint.sh` roda `prisma db push` e cria o schema no Neon.
5. Teste a URL gerada (ex.: `https://guia-hospede-api.onrender.com`):
   - `GET /api/health` → `{"status":"ok"}`
   - `GET /docs` → Swagger
   Guarde essa URL — é a base da API.

> ⚠️ **Cold start (free):** após ~15 min sem tráfego o serviço hiberna; a
> próxima requisição demora ~50s para responder. Normal no plano gratuito.

---

## 3) Frontend — Vercel

1. Crie conta em <https://vercel.com> e **Add New → Project**, importando este repo.
2. Em **Root Directory**, selecione **`frontend`**.
   - Framework: **Vite** (detectado). Build `npm run build`, output `dist`
     (o [`frontend/vercel.json`](frontend/vercel.json) já cuida do roteamento SPA).
3. Em **Environment Variables**, adicione:
   | Variável | Valor |
   | --- | --- |
   | `VITE_API_URL` | `https://SUA-API.onrender.com/api` (URL do passo 2 + `/api`) |
   > A variável é embutida no build, então precisa existir **antes** do deploy.
4. **Deploy**. Ao final você terá algo como `https://guia-hospede.vercel.app`.

---

## 4) Fechar o CORS (voltar ao Render)

1. No Render, edite `CORS_ORIGIN` e coloque a URL da Vercel:
   ```
   CORS_ORIGIN=https://guia-hospede.vercel.app
   ```
   (Pode listar várias separadas por vírgula, ex.: incluir um domínio custom.)
2. Salve — o Render reinicia o serviço.

---

## 5) Testar de ponta a ponta

1. Abra a URL da Vercel.
2. Crie um imóvel (ou veja os existentes) — o guia por IA é gerado no cadastro.
3. Na tela do imóvel, use o **chat flutuante** (💬) e pergunte "Qual a senha do WiFi?".
   - Se a 1ª resposta demorar, é o cold start do Render acordando.

### (Opcional) Popular com o imóvel de exemplo
A partir da sua máquina, apontando para o Neon:
```bash
DATABASE_URL="<string-do-neon>" npm run db:seed
```

---

## Resumo das variáveis de ambiente

**API (Render):** `DATABASE_URL`, `OPENROUTER_API_KEY`, `LLM_MODEL`,
`OPENROUTER_BASE_URL`, `LLM_MAX_TOKENS`, `CORS_ORIGIN` (o `PORT` é automático).

**Frontend (Vercel):** `VITE_API_URL`.

> Nenhum segredo fica no repositório — todos são definidos nos painéis das
> plataformas. Os arquivos `.env` continuam no `.gitignore`.
