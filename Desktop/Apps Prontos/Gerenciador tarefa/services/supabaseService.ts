
import { Task, User, GroupPermissions, Sector, AppNotification } from '../types';

// Lê as variáveis de ambiente injetadas pelo Vite/Vercel (prefixo VITE_)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface SupabaseResponse<T> {
  data: T[] | null;
  error: any;
}

class SupabaseService {
  private url = SUPABASE_URL;
  private key = SUPABASE_KEY;

  private async request<T>(
    table: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    data?: any,
    filters?: Record<string, any>
  ): Promise<T[]> {
    // Garantia: variáveis obrigatórias devem estar definidas em produção
    if (!this.url || !this.key) {
      console.error('Supabase: variáveis de ambiente ausentes. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
      return [];
    }
    let url = `${this.url}/rest/v1/${table}`;
    
    if (filters) {
      const filterParams = Object.entries(filters)
        .map(([key, value]) => `${key}=eq.${value}`)
        .join('&');
      url += `?${filterParams}`;
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.key}`,
        'apikey': this.key,
      },
    };

    if (data && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        console.error(`Supabase error: ${response.statusText}`);
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error('Supabase request failed:', error);
      return [];
    }
  }

  // ============================================================================
  // OPERAÇÕES COM SETORES
  // ============================================================================

  async getSectors(): Promise<Sector[]> {
    const data = await this.request<any>('operational_sectors', 'GET');
    return data.map(s => ({
      id: s.id,
      name: s.name,
      initials: s.initials,
      active: s.active,
      color: s.color,
    }));
  }

  async createSector(sector: Omit<Sector, 'id'>): Promise<Sector | null> {
    const result = await this.request<any>('operational_sectors', 'POST', {
      name: sector.name,
      initials: sector.initials,
      active: sector.active,
      color: sector.color,
    });
    return result.length > 0 ? {
      id: result[0].id,
      name: result[0].name,
      initials: result[0].initials,
      active: result[0].active,
      color: result[0].color,
    } : null;
  }

  async updateSector(id: string, sector: Partial<Sector>): Promise<boolean> {
    const result = await this.request<any>('operational_sectors', 'PATCH', sector, { id });
    return result.length > 0;
  }

  async deleteSector(id: string): Promise<boolean> {
    const result = await this.request<any>('operational_sectors', 'DELETE', null, { id });
    return true;
  }

  // ============================================================================
  // OPERAÇÕES COM GRUPOS DE PERMISSÕES
  // ============================================================================

  async getGroups(): Promise<GroupPermissions[]> {
    const data = await this.request<any>('group_permissions', 'GET');
    return data.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      canCreate: g.can_create,
      canViewAll: g.can_view_all,
      canUpdateStatus: g.can_update_status,
      canComment: g.can_comment,
      canAttach: g.can_attach,
      canFinish: g.can_finish,
      canViewDashboards: g.can_view_dashboards,
      isSystem: g.is_system,
    }));
  }

  async createGroup(group: Omit<GroupPermissions, 'id'>): Promise<GroupPermissions | null> {
    const result = await this.request<any>('group_permissions', 'POST', {
      name: group.name,
      description: group.description,
      can_create: group.canCreate,
      can_view_all: group.canViewAll,
      can_update_status: group.canUpdateStatus,
      can_comment: group.canComment,
      can_attach: group.canAttach,
      can_finish: group.canFinish,
      can_view_dashboards: group.canViewDashboards,
      is_system: group.isSystem,
    });
    return result.length > 0 ? {
      id: result[0].id,
      name: result[0].name,
      description: result[0].description,
      canCreate: result[0].can_create,
      canViewAll: result[0].can_view_all,
      canUpdateStatus: result[0].can_update_status,
      canComment: result[0].can_comment,
      canAttach: result[0].can_attach,
      canFinish: result[0].can_finish,
      canViewDashboards: result[0].can_view_dashboards,
      isSystem: result[0].is_system,
    } : null;
  }

  async updateGroup(id: string, group: Partial<GroupPermissions>): Promise<boolean> {
    const updateData: any = {};
    if (group.name !== undefined) updateData.name = group.name;
    if (group.description !== undefined) updateData.description = group.description;
    if (group.canCreate !== undefined) updateData.can_create = group.canCreate;
    if (group.canViewAll !== undefined) updateData.can_view_all = group.canViewAll;
    if (group.canUpdateStatus !== undefined) updateData.can_update_status = group.canUpdateStatus;
    if (group.canComment !== undefined) updateData.can_comment = group.canComment;
    if (group.canAttach !== undefined) updateData.can_attach = group.canAttach;
    if (group.canFinish !== undefined) updateData.can_finish = group.canFinish;
    if (group.canViewDashboards !== undefined) updateData.can_view_dashboards = group.canViewDashboards;

    const result = await this.request<any>('group_permissions', 'PATCH', updateData, { id });
    return result.length > 0;
  }

  async deleteGroup(id: string): Promise<boolean> {
    const result = await this.request<any>('group_permissions', 'DELETE', null, { id });
    return true;
  }

  // ============================================================================
  // OPERAÇÕES COM USUÁRIOS
  // ============================================================================

  async getUsers(): Promise<User[]> {
    const data = await this.request<any>('users', 'GET');
    return data.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      sectorId: u.sector_id,
      groupIds: u.group_ids || [],
      active: u.active,
      avatar: u.avatar,
    }));
  }

  async createUser(user: Omit<User, 'id'>): Promise<User | null> {
    const result = await this.request<any>('users', 'POST', {
      name: user.name,
      email: user.email,
      sector_id: user.sectorId,
      group_ids: user.groupIds,
      active: user.active,
      avatar: user.avatar,
    });
    return result.length > 0 ? {
      id: result[0].id,
      name: result[0].name,
      email: result[0].email,
      sectorId: result[0].sector_id,
      groupIds: result[0].group_ids || [],
      active: result[0].active,
      avatar: result[0].avatar,
    } : null;
  }

  async updateUser(id: string, user: Partial<User>): Promise<boolean> {
    const updateData: any = {};
    if (user.name !== undefined) updateData.name = user.name;
    if (user.email !== undefined) updateData.email = user.email;
    if (user.sectorId !== undefined) updateData.sector_id = user.sectorId;
    if (user.groupIds !== undefined) updateData.group_ids = user.groupIds;
    if (user.active !== undefined) updateData.active = user.active;
    if (user.avatar !== undefined) updateData.avatar = user.avatar;

    const result = await this.request<any>('users', 'PATCH', updateData, { id });
    return result.length > 0;
  }

  // ============================================================================
  // OPERAÇÕES COM TAREFAS
  // ============================================================================

  async getTasks(): Promise<Task[]> {
    const data = await this.request<any>('tasks', 'GET');
    return data.map(t => ({
      id: t.id,
      type: t.type,
      requestingSector: t.requesting_sector,
      responsibleSector: t.responsible_sector,
      priority: t.priority,
      description: t.description,
      productProfile: t.product_profile,
      opNumber: t.op_number,
      quantity: t.quantity,
      openDate: t.open_date,
      deadline: t.deadline,
      responsibleId: t.responsible_id,
      executorGroupId: t.executor_group_id,
      requestorId: t.requestor_id,
      followerIds: t.follower_ids || [],
      status: t.status,
      visibility: t.visibility,
      visibleGroupIds: t.visible_group_ids || [],
      visibleUserIds: t.visible_user_ids || [],
      history: [],
      attachments: [],
      steps: [],
    }));
  }

  async createTask(task: Omit<Task, 'id' | 'history' | 'attachments' | 'steps'>): Promise<Task | null> {
    const result = await this.request<any>('tasks', 'POST', {
      type: task.type,
      requesting_sector: task.requestingSector,
      responsible_sector: task.responsibleSector,
      priority: task.priority,
      description: task.description,
      product_profile: task.productProfile,
      op_number: task.opNumber,
      quantity: task.quantity,
      open_date: task.openDate,
      deadline: task.deadline,
      responsible_id: task.responsibleId,
      executor_group_id: task.executorGroupId,
      requestor_id: task.requestorId,
      follower_ids: task.followerIds,
      status: task.status,
      visibility: task.visibility,
      visible_group_ids: task.visibleGroupIds,
      visible_user_ids: task.visibleUserIds,
    });
    
    return result.length > 0 ? {
      id: result[0].id,
      type: result[0].type,
      requestingSector: result[0].requesting_sector,
      responsibleSector: result[0].responsible_sector,
      priority: result[0].priority,
      description: result[0].description,
      productProfile: result[0].product_profile,
      opNumber: result[0].op_number,
      quantity: result[0].quantity,
      openDate: result[0].open_date,
      deadline: result[0].deadline,
      responsibleId: result[0].responsible_id,
      executorGroupId: result[0].executor_group_id,
      requestorId: result[0].requestor_id,
      followerIds: result[0].follower_ids || [],
      status: result[0].status,
      visibility: result[0].visibility,
      visibleGroupIds: result[0].visible_group_ids || [],
      visibleUserIds: result[0].visible_user_ids || [],
      history: [],
      attachments: [],
      steps: [],
    } : null;
  }

  async updateTask(id: string, task: Partial<Task>): Promise<boolean> {
    const updateData: any = {};
    if (task.status !== undefined) updateData.status = task.status;
    if (task.priority !== undefined) updateData.priority = task.priority;
    if (task.description !== undefined) updateData.description = task.description;
    if (task.deadline !== undefined) updateData.deadline = task.deadline;
    if (task.responsibleId !== undefined) updateData.responsible_id = task.responsibleId;

    const result = await this.request<any>('tasks', 'PATCH', updateData, { id });
    return result.length > 0;
  }
}

export const supabaseService = new SupabaseService();
