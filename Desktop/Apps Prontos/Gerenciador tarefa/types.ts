
export enum UserRole {
  ADMIN = 'Administrador',
  PCP = 'PCP',
  PRODUCTION = 'Produção (Extrusão)',
  MACHINING = 'Usinagem',
  QUALITY = 'Qualidade',
  SHIPPING = 'Expedição',
  MAINTENANCE = 'Manutenção',
  ENGINEERING = 'Engenharia'
}

export enum TaskVisibility {
  GLOBAL = 'Global',
  GROUP = 'Grupo',
  PRIVATE = 'Privado'
}

export interface GroupPermissions {
  id: string;
  name: UserRole | string;
  canCreate: boolean;
  canViewAll: boolean;
  canUpdateStatus: boolean;
  canComment: boolean;
  canAttach: boolean;
  canFinish: boolean;
  canViewDashboards: boolean;
}

export enum TaskType {
  ROUTINE = 'Rotina de Trabalho',
  QUALITY_TEST = 'Teste de Qualidade',
  PRODUCTION_PRIORITY = 'Prioridade de Produção',
  SAMPLE_CUT = 'Corte de Amostra',
  MACHINING_REQUEST = 'Solicitação de Usinagem',
  SHIPPING_PRIORITY = 'Prioridade de Expedição',
  OPERATIONAL_INCIDENT = 'Ocorrência Operacional'
}

export enum TaskPriority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  CRITICAL = 'Crítica'
}

export enum TaskStatus {
  OPEN = 'Aberto',
  IN_PROGRESS = 'Em andamento',
  WAITING = 'Aguardando',
  COMPLETED = 'Concluído',
  CANCELED = 'Cancelado'
}

export enum StepStatus {
  PENDING = 'Pendente',
  IN_PROGRESS = 'Em andamento',
  COMPLETED = 'Concluída'
}

export interface TaskStep {
  id: string;
  title: string;
  description?: string;
  responsibleGroupId: string; // Setor responsável
  responsibleUserId?: string; // Usuário específico (opcional)
  deadline?: string;
  status: StepStatus;
  order: number;
  completedAt?: string;
  completedBy?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  sector: UserRole;
  groupIds: string[];
  active: boolean;
  avatar?: string;
}

export interface TaskHistory {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details: string;
  comment?: string;
  type: 'system' | 'manual' | 'step';
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedBy: string;
  date: string;
}

export interface Task {
  id: string;
  type: TaskType;
  requestingSector: UserRole;
  responsibleSector: UserRole;
  priority: TaskPriority;
  description: string;
  productProfile: string;
  opNumber?: string;
  quantity?: number;
  openDate: string;
  deadline: string;
  responsibleId?: string;
  executorGroupId: string;
  requestorId: string;
  followerIds: string[];
  status: TaskStatus;
  visibility: TaskVisibility;
  visibleGroupIds?: string[];
  visibleUserIds?: string[];
  history: TaskHistory[];
  attachments: Attachment[];
  steps: TaskStep[];
  // Campos dinâmicos
  machiningType?: 'Furação' | 'Corte' | 'Acabamento';
  qualityResult?: 'Aprovado' | 'Reprovado' | 'Pendente';
  shippingType?: 'Carga Fechada' | 'Fracionada' | 'Urgente';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'info' | 'success';
  date: string;
  read: boolean;
  taskId?: string;
}
