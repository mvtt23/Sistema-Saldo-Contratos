# Sistema de Gestão de Contratos da Prefeitura

Este é um sistema web para gestão de contratos da prefeitura, construído com React, TypeScript e Supabase.

## Tecnologias Utilizadas

- **Frontend**: React 18 com TypeScript
- **UI Components**: shadcn/ui com Tailwind CSS
- **Database**: Supabase PostgreSQL
- **Autenticação**: Supabase Auth
- **Build Tool**: Vite

## Como Rodar Localmente

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente (crie um arquivo `.env.local`):
   ```env
   VITE_SUPABASE_URL=seu_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Deploy no Vercel

### Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Conta no [Supabase](https://supabase.com)
3. Repositório do projeto no GitHub

### Passo a Passo

1. **Configure o Supabase**:
   - Crie um novo projeto no Supabase
   - Copie o URL e a chave anon do projeto
   - Configure as variáveis de ambiente no Vercel

2. **Configure o Vercel**:
   - Importe seu repositório para o Vercel
   - Configure as variáveis de ambiente:
     ```
     VITE_SUPABASE_URL=https://seu-projeto.supabase.co
     VITE_SUPABASE_ANON_KEY=sua-chave-anon
     ```
   - Deploy automático será ativado

3. **Configurações Adicionais**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Variáveis de Ambiente Necessárias

No Vercel, configure estas variáveis de ambiente:

- `VITE_SUPABASE_URL`: URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave pública do seu projeto Supabase

### Estrutura do Projeto

```
src/
├── components/          # Componentes React
├── contexts/           # Contextos React
├── hooks/              # Custom hooks
├── lib/                # Configurações e utilitários
├── types/              # Tipos TypeScript
└── App.tsx             # Componente principal
```

## Funcionalidades

- ✅ Gestão de contratos
- ✅ Cadastro de empresas
- ✅ Gestão de unidades gestoras
- ✅ Relatórios em PDF
- ✅ Autenticação de usuários
- ✅ Controle de permissões

## Licença

MIT License