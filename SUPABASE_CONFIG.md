# Configuração do Supabase - Sistema de Gestão de Contratos

## 1. Variáveis de Ambiente

As credenciais do Supabase estão armazenadas de forma segura no arquivo `.env` (que está protegido pelo `.gitignore`):

```env
VITE_SUPABASE_URL=https://rlnxipzrvzqzbphjcuuw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 2. Estrutura do Banco de Dados

### Tabelas Criadas:

#### 2.1. Tabela `users`
Armazena os usuários do sistema com controle de acesso.

**Campos:**
- `id` (uuid) - Identificador único
- `username` (text) - Nome de usuário (único)
- `password` (text) - Senha do usuário
- `role` (text) - Papel do usuário (admin, manager, viewer)
- `is_active` (boolean) - Status de ativação
- `created_at` (timestamptz) - Data de criação
- `updated_at` (timestamptz) - Data de atualização

**Credenciais Padrão:**
- Usuário: `admin`
- Senha: `admin123`

#### 2.2. Tabela `user_permissions`
Controla permissões granulares por módulo.

**Campos:**
- `id` (uuid) - Identificador único
- `user_id` (uuid) - Referência ao usuário
- `module` (text) - Nome do módulo
- `can_view` (boolean) - Permissão de visualização
- `can_edit` (boolean) - Permissão de edição
- `can_create` (boolean) - Permissão de criação
- `can_delete` (boolean) - Permissão de exclusão

#### 2.3. Tabela `companies`
Armazena empresas contratadas.

**Campos:**
- `id` (uuid) - Identificador único
- `name` (text) - Nome da empresa
- `document` (text) - CNPJ (único)
- `city` (text) - Cidade
- `state` (text) - Estado

#### 2.4. Tabela `managing_units`
Armazena unidades gestoras (secretarias).

**Campos:**
- `id` (uuid) - Identificador único
- `name` (text) - Nome da unidade
- `code` (text) - Código da unidade (único)
- `responsible` (text) - Responsável
- `email` (text) - Email
- `phone` (text) - Telefone
- `fiscal_id` (text) - ID do fiscal

#### 2.5. Tabela `programs`
Armazena programas vinculados às unidades gestoras.

**Campos:**
- `id` (uuid) - Identificador único
- `name` (text) - Nome do programa
- `unit_id` (uuid) - Referência à unidade gestora

#### 2.6. Tabela `contracts`
Armazena os contratos principais.

**Campos:**
- `id` (uuid) - Identificador único
- `number` (text) - Número do contrato (único)
- `modality` (text) - Modalidade de licitação
- `is_carona` (boolean) - Se é contrato carona
- `object` (text) - Objeto do contrato
- `contractor` (text) - Nome da contratada
- `managing_unit` (text) - Unidade gestora
- `original_value` (numeric) - Valor original
- `current_value` (numeric) - Valor atual
- `used_value` (numeric) - Valor utilizado
- `remaining_balance` (numeric) - Saldo remanescente
- `start_date` (date) - Data de início
- `end_date` (date) - Data de término
- `status` (text) - Status do contrato

#### 2.7. Tabela `additives`
Armazena aditivos contratuais.

**Campos:**
- `id` (uuid) - Identificador único
- `contract_id` (uuid) - Referência ao contrato
- `type` (text) - Tipo de aditivo (value, term, both)
- `description` (text) - Descrição do aditivo
- `value_change` (numeric) - Mudança de valor
- `term_change` (integer) - Mudança de prazo (dias)
- `date` (date) - Data do aditivo
- `justification` (text) - Justificativa

#### 2.8. Tabela `invoices`
Armazena notas fiscais dos contratos.

**Campos:**
- `id` (uuid) - Identificador único
- `contract_id` (uuid) - Referência ao contrato
- `number` (text) - Número da nota fiscal
- `value` (numeric) - Valor da nota
- `date` (date) - Data da nota

## 3. Dados Iniciais (Seed)

### Usuários:
- 1 usuário admin (admin/admin123)

### Empresas:
- 5 empresas contratadas de exemplo

### Unidades Gestoras:
- Secretaria de Educação (SEMED)
- Secretaria de Saúde (SESAU)
- Secretaria de Obras (SEOBR)
- Secretaria de Transporte (SETRANS)

### Programas:
- 6 programas vinculados às unidades

### Contratos:
- 5 contratos de exemplo com diferentes modalidades
- 2 aditivos contratuais
- 15 notas fiscais distribuídas entre os contratos

## 4. Arquivos de Referência

- **`supabase_schema.sql`** - Script SQL completo com todas as tabelas e dados iniciais
- **`.env`** - Variáveis de ambiente (protegido pelo .gitignore)
- **`src/lib/supabase.ts`** - Cliente Supabase configurado

## 5. Como Usar

### Login no Sistema:
```
Usuário: admin
Senha: admin123
```

### Acessar o Banco de Dados:
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Use o SQL Editor para executar consultas
3. Use o Table Editor para visualizar e editar dados

### Consultas SQL de Exemplo:

```sql
-- Listar todos os contratos ativos
SELECT * FROM contracts WHERE status = 'active';

-- Listar contratos com seus aditivos
SELECT c.number, c.object, a.description, a.value_change
FROM contracts c
LEFT JOIN additives a ON c.id = a.contract_id;

-- Listar notas fiscais por contrato
SELECT c.number, i.number as invoice_number, i.value, i.date
FROM contracts c
JOIN invoices i ON c.id = i.contract_id
ORDER BY c.number, i.date;

-- Listar usuários e suas permissões
SELECT u.username, u.role, p.module, p.can_view, p.can_edit
FROM users u
LEFT JOIN user_permissions p ON u.id = p.user_id;
```

## 6. Segurança

- Arquivo `.env` está no `.gitignore` para não ser commitado
- Senhas em produção devem usar hash (bcrypt, argon2)
- RLS (Row Level Security) está habilitado nas tabelas de usuários
- Todas as tabelas possuem índices para performance

## 7. Próximos Passos Recomendados

1. Implementar hash de senha (bcrypt)
2. Adicionar RLS em todas as tabelas
3. Criar políticas de acesso por papel de usuário
4. Implementar auditoria de mudanças
5. Adicionar validações de dados no backend
