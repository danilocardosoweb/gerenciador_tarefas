# Schema do Banco de Dados - Gerenciador de Tarefas

## Projeto Supabase
- **ID do Projeto:** jmiajqfqllopfpnknpek
- **Nome:** database_danilo
- **Região:** sa-east-1
- **Status:** ACTIVE_HEALTHY

## Tabelas Criadas

### 1. **users**
Armazena informações dos usuários do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único (PK) |
| name | VARCHAR(255) | Nome do usuário |
| email | VARCHAR(255) | Email único do usuário |
| sector | VARCHAR(100) | Setor/Departamento do usuário |
| active | BOOLEAN | Status ativo/inativo |
| avatar | VARCHAR(500) | URL do avatar |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data da última atualização |

---

### 2. **groups**
Define grupos de usuários com permissões específicas (setores/departamentos).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único (PK) |
| name | VARCHAR(100) | Nome do grupo |
| can_create | BOOLEAN | Permissão para criar tarefas |
| can_view_all | BOOLEAN | Permissão para visualizar todas as tarefas |
| can_update_status | BOOLEAN | Permissão para atualizar status |
| can_comment | BOOLEAN | Permissão para comentar |
| can_attach | BOOLEAN | Permissão para anexar arquivos |
| can_finish | BOOLEAN | Permissão para finalizar tarefas |
| can_view_dashboards | BOOLEAN | Permissão para visualizar dashboards |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data da última atualização |

---

### 3. **user_groups**
Tabela de relacionamento entre usuários e grupos (muitos-para-muitos).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único (PK) |
| user_id | UUID | Referência ao usuário (FK) |
| group_id | UUID | Referência ao grupo (FK) |
| created_at | TIMESTAMP | Data de criação |

**Constraints:** UNIQUE(user_id, group_id)

---

### 4. **tasks**
Armazena as tarefas/ordens de produção do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único (PK) |
| type | VARCHAR(100) | Tipo de tarefa |
| requesting_sector | VARCHAR(100) | Setor solicitante |
| responsible_sector | VARCHAR(100) | Setor responsável |
| priority | VARCHAR(50) | Prioridade (Baixa, Média, Alta, Crítica) |
| description | TEXT | Descrição da tarefa |
| product_profile | VARCHAR(255) | Perfil do produto |
| op_number | VARCHAR(50) | Número da OP (Ordem de Produção) |
| quantity | INTEGER | Quantidade |
| open_date | TIMESTAMP | Data de abertura |
| deadline | DATE | Prazo de entrega |
| responsible_id | UUID | Usuário responsável (FK) |
| executor_group_id | UUID | Grupo executor (FK) |
| requestor_id | UUID | Usuário solicitante (FK) |
| status | VARCHAR(50) | Status (Aberto, Em andamento, Aguardando, Concluído, Cancelado) |
| visibility | VARCHAR(50) | Visibilidade (Global, Grupo, Privado) |
| machining_type | VARCHAR(100) | Tipo de usinagem (opcional) |
| quality_result | VARCHAR(100) | Resultado de qualidade (opcional) |
| shipping_type | VARCHAR(100) | Tipo de expedição (opcional) |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data da última atualização |

---

### 5. **task_steps**
Etapas/passos de uma tarefa.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único (PK) |
| task_id | UUID | Referência à tarefa (FK) |
| title | VARCHAR(255) | Título da etapa |
| description | TEXT | Descrição da etapa |
| responsible_group_id | UUID | Grupo responsável (FK) |
| responsible_user_id | UUID | Usuário responsável (FK) |
| deadline | DATE | Prazo da etapa |
| status | VARCHAR(50) | Status (Pendente, Em andamento, Concluída) |
| order_index | INTEGER | Ordem da etapa |
| completed_at | TIMESTAMP | Data de conclusão |
| completed_by | UUID | Usuário que concluiu (FK) |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data da última atualização |

---

### 6. **task_history**
Histórico de alterações das tarefas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único (PK) |
| task_id | UUID | Referência à tarefa (FK) |
| user_id | UUID | Usuário que fez a alteração (FK) |
| user_name | VARCHAR(255) | Nome do usuário |
| action | VARCHAR(255) | Ação realizada |
| details | TEXT | Detalhes da ação |
| comment | TEXT | Comentário adicional |
| type | VARCHAR(50) | Tipo (system, manual, step) |
| created_at | TIMESTAMP | Data da alteração |

---

### 7. **attachments**
Anexos das tarefas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único (PK) |
| task_id | UUID | Referência à tarefa (FK) |
| name | VARCHAR(255) | Nome do arquivo |
| type | VARCHAR(100) | Tipo de arquivo |
| url | VARCHAR(500) | URL do arquivo |
| uploaded_by | UUID | Usuário que fez upload (FK) |
| created_at | TIMESTAMP | Data de criação |

---

### 8. **notifications**
Notificações do sistema para usuários.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único (PK) |
| user_id | UUID | Usuário destinatário (FK) |
| title | VARCHAR(255) | Título da notificação |
| message | TEXT | Mensagem da notificação |
| type | VARCHAR(50) | Tipo (alert, info, success) |
| read | BOOLEAN | Status de leitura |
| task_id | UUID | Tarefa relacionada (FK) |
| created_at | TIMESTAMP | Data de criação |

---

### 9. **task_visibility**
Controla a visibilidade das tarefas por grupo ou usuário específico.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único (PK) |
| task_id | UUID | Referência à tarefa (FK) |
| group_id | UUID | Grupo com acesso (FK) |
| user_id | UUID | Usuário com acesso (FK) |
| created_at | TIMESTAMP | Data de criação |

**Constraints:** CHECK ((group_id IS NOT NULL AND user_id IS NULL) OR (group_id IS NULL AND user_id IS NOT NULL))

---

### 10. **task_followers**
Usuários que acompanham uma tarefa.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único (PK) |
| task_id | UUID | Referência à tarefa (FK) |
| user_id | UUID | Usuário acompanhador (FK) |
| created_at | TIMESTAMP | Data de criação |

**Constraints:** UNIQUE(task_id, user_id)

---

## Relacionamentos

```
users (1) ──→ (N) user_groups ←─ (1) groups
users (1) ──→ (N) tasks (requestor_id)
users (1) ──→ (N) tasks (responsible_id)
groups (1) ──→ (N) tasks (executor_group_id)
tasks (1) ──→ (N) task_steps
tasks (1) ──→ (N) task_history
tasks (1) ──→ (N) attachments
tasks (1) ──→ (N) notifications
tasks (1) ──→ (N) task_visibility
tasks (1) ──→ (N) task_followers
users (1) ──→ (N) task_history
users (1) ──→ (N) attachments
users (1) ──→ (N) task_followers
groups (1) ──→ (N) task_steps (responsible_group_id)
```

---

## Notas Importantes

1. Todas as tabelas utilizam UUID como chave primária para melhor escalabilidade.
2. Os timestamps (created_at, updated_at) são automáticos no banco de dados.
3. As foreign keys possuem ON DELETE CASCADE para manter a integridade referencial.
4. A tabela `task_visibility` permite controlar acesso granular às tarefas.
5. A tabela `task_followers` permite que usuários acompanhem tarefas específicas.
6. As permissões são gerenciadas na tabela `groups` e associadas aos usuários via `user_groups`.

---

## Próximos Passos

1. Inserir dados iniciais (usuários, grupos, permissões)
2. Configurar Row Level Security (RLS) no Supabase
3. Criar índices para melhorar performance
4. Integrar o frontend com as APIs do Supabase
