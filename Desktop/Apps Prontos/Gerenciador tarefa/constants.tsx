
import { TaskStatus, TaskPriority, TaskType, UserRole, GroupPermissions, TaskVisibility, StepStatus } from './types';

export const DEFAULT_GROUPS: GroupPermissions[] = [
  {
    id: 'g-admin',
    name: UserRole.ADMIN,
    canCreate: true,
    canViewAll: true,
    canUpdateStatus: true,
    canComment: true,
    canAttach: true,
    canFinish: true,
    canViewDashboards: true,
  },
  {
    id: 'g-pcp',
    name: UserRole.PCP,
    canCreate: true,
    canViewAll: true,
    canUpdateStatus: true,
    canComment: true,
    canAttach: true,
    canFinish: true,
    canViewDashboards: true,
  },
  {
    id: 'g-prod',
    name: UserRole.PRODUCTION,
    canCreate: true,
    canViewAll: false,
    canUpdateStatus: true,
    canComment: true,
    canAttach: true,
    canFinish: true,
    canViewDashboards: false,
  },
  {
    id: 'g-qual',
    name: UserRole.QUALITY,
    canCreate: true,
    canViewAll: true,
    canUpdateStatus: false,
    canComment: true,
    canAttach: true,
    canFinish: false,
    canViewDashboards: true,
  }
];

export const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.OPEN]: 'bg-slate-100 text-slate-700 border-slate-200',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-700 border-blue-200',
  [TaskStatus.WAITING]: 'bg-amber-100 text-amber-700 border-amber-200',
  [TaskStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [TaskStatus.CANCELED]: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'bg-slate-100 text-slate-600',
  [TaskPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [TaskPriority.HIGH]: 'bg-orange-100 text-orange-800',
  [TaskPriority.CRITICAL]: 'bg-red-600 text-white',
};

export const MOCK_USERS = [
  { id: 'u-1', name: 'Carlos Silva', sector: UserRole.ADMIN, email: 'carlos@tecnoperfil.com.br', groupIds: ['g-admin'], active: true, avatar: 'https://i.pravatar.cc/150?u=u1' },
  { id: 'u-2', name: 'Ana Oliveira', sector: UserRole.PCP, email: 'ana.pcp@tecnoperfil.com.br', groupIds: ['g-pcp'], active: true, avatar: 'https://i.pravatar.cc/150?u=u2' },
  { id: 'u-3', name: 'João Santos', sector: UserRole.PRODUCTION, email: 'joao.prod@tecnoperfil.com.br', groupIds: ['g-prod'], active: true, avatar: 'https://i.pravatar.cc/150?u=u3' },
  { id: 'u-4', name: 'Beatriz Costa', sector: UserRole.QUALITY, email: 'beatriz.qual@tecnoperfil.com.br', groupIds: ['g-qual'], active: true, avatar: 'https://i.pravatar.cc/150?u=u4' },
];

export const MOCK_TASKS = [
  {
    id: 'T-1001',
    type: TaskType.PRODUCTION_PRIORITY,
    requestingSector: UserRole.PCP,
    responsibleSector: UserRole.PRODUCTION,
    priority: TaskPriority.HIGH,
    description: 'Priorizar extrusão do perfil 20x20 natural para cliente Master S/A.',
    productProfile: '20x20 Natural Anodizado',
    opNumber: 'OP-5582',
    quantity: 500,
    openDate: '2023-10-25T10:00:00Z',
    deadline: '2023-10-27',
    status: TaskStatus.IN_PROGRESS,
    visibility: TaskVisibility.GLOBAL,
    requestorId: 'u-2',
    executorGroupId: 'g-prod',
    followerIds: ['u-4'],
    history: [],
    steps: [
      { id: 's1', title: 'Verificar disponibilidade de matéria-prima', status: StepStatus.COMPLETED, order: 1, responsibleGroupId: 'g-pcp' },
      { id: 's2', title: 'Configurar matriz na extrusora 04', status: StepStatus.IN_PROGRESS, order: 2, responsibleGroupId: 'g-prod' },
      { id: 's3', title: 'Iniciar extrusão do lote', status: StepStatus.PENDING, order: 3, responsibleGroupId: 'g-prod' }
    ]
  },
  {
    id: 'T-1002',
    type: TaskType.QUALITY_TEST,
    requestingSector: UserRole.PRODUCTION,
    responsibleSector: UserRole.QUALITY,
    priority: TaskPriority.MEDIUM,
    description: 'Teste de tração e dureza no lote 34B.',
    productProfile: 'Perfil Estrutural Heavy Duty',
    opNumber: 'OP-5590',
    quantity: 12,
    openDate: '2023-10-25T11:30:00Z',
    deadline: '2023-10-26',
    status: TaskStatus.OPEN,
    visibility: TaskVisibility.GROUP,
    visibleGroupIds: ['g-prod', 'g-qual'],
    requestorId: 'u-3',
    executorGroupId: 'g-qual',
    followerIds: [],
    history: [],
    steps: [
      { id: 's4', title: 'Coletar amostras na linha', status: StepStatus.PENDING, order: 1, responsibleGroupId: 'g-prod' },
      { id: 's5', title: 'Realizar teste de tração', status: StepStatus.PENDING, order: 2, responsibleGroupId: 'g-qual' }
    ]
  }
];
