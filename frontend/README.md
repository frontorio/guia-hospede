# Guia Hóspede — Frontend

Painel web (SPA) para gerenciar os imóveis de hospedagem e seus guias de
experiências gerados por IA. Consome a **API NestJS** do diretório pai.

## 🧱 Stack

- **React 18 + Vite + TypeScript**
- **Tailwind CSS** (estilização)
- **React Router** (rotas)
- **TanStack Query** (cache, estados de loading/erro, mutations)
- **React Hook Form** (formulário de imóvel)

## 🚀 Como rodar

Pré-requisito: a **API** precisa estar no ar (veja o README na raiz). Por padrão
em `http://localhost:3000/api`.

```bash
cd frontend
npm install
cp .env.example .env      # ajuste VITE_API_URL se necessário
npm run dev
```

App em **http://localhost:5173**.

> A API já habilita **CORS**. Para restringir a origem em produção, defina
> `CORS_ORIGIN` no backend (ex.: `CORS_ORIGIN=https://app.seudominio.com`).

### Scripts

| Script              | Descrição                          |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento (HMR)  |
| `npm run build`     | Type-check + build de produção     |
| `npm run preview`   | Serve o build localmente           |
| `npm run typecheck` | Apenas checagem de tipos           |

## 🗺️ Telas

| Rota                       | Descrição                                            |
| -------------------------- | ---------------------------------------------------- |
| `/`                        | Lista de imóveis (cards)                             |
| `/properties/new`          | Cadastro de novo imóvel                              |
| `/properties/:code`        | Detalhes + **guia de experiências (IA)**            |
| `/properties/:code/edit`   | Edição do imóvel (acessível por URL)                |

> As URLs usam o **CODE** do imóvel (ex.: `/properties/GRM001`), não o UUID.
> A tela de detalhes é somente leitura: **não** possui botões de editar nem de
> regenerar o guia.

## 🤖 Guia de experiências

Na tela de detalhes, o guia é exibido (somente leitura) a partir do próprio
imóvel — o `GET` do imóvel já retorna o `guidebook`. A geração/atualização
acontece **automaticamente no backend** quando o imóvel é criado ou editado
(via evento + agente de IA); a interface não expõe botão de regenerar.

## ⚙️ Variáveis de ambiente

| Variável       | Descrição                     | Padrão                        |
| -------------- | ----------------------------- | ----------------------------- |
| `VITE_API_URL` | URL base da API (com `/api`)  | `http://localhost:3000/api`   |
