
import React from 'react';
import { GroupPermissions } from '../types';
import { Shield, Check, X, Lock } from 'lucide-react';

interface GroupManagementProps {
  groups: GroupPermissions[];
  onUpdatePermissions: (groupId: string, perms: Partial<GroupPermissions>) => void;
}

const GroupManagement: React.FC<GroupManagementProps> = ({ groups, onUpdatePermissions }) => {
  const permissionKeys: (keyof GroupPermissions)[] = [
    'canCreate', 'canViewAll', 'canUpdateStatus', 'canComment', 'canAttach', 'canFinish', 'canViewDashboards'
  ];

  const labels: Record<string, string> = {
    canCreate: 'Criar Tarefas',
    canViewAll: 'Visualizar Tudo',
    canUpdateStatus: 'Alterar Status',
    canComment: 'Comentar',
    canAttach: 'Anexar',
    canFinish: 'Finalizar',
    canViewDashboards: 'Dashboards'
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Perfis de Acesso</h2>
        <p className="text-slate-500">Defina o que cada setor pode realizar dentro do sistema</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-6 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[200px]">Permissão</th>
              {groups.map(group => (
                <th key={group.id} className="px-6 py-6 text-center min-w-[120px]">
                  <div className="flex flex-col items-center gap-1">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-700">{group.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {permissionKeys.map(key => (
              <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-700 text-sm">
                  {labels[key as string]}
                </td>
                {groups.map(group => (
                  <td key={group.id} className="px-6 py-4 text-center">
                    <button
                      onClick={() => onUpdatePermissions(group.id, { [key]: !group[key] })}
                      className={`w-10 h-6 rounded-full transition-all relative ${group[key] ? 'bg-blue-600' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${group[key] ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
        <Lock className="w-5 h-5 text-amber-500 shrink-0" />
        <div className="text-xs text-amber-700 leading-relaxed">
          <strong>Atenção:</strong> Alterações de permissões são aplicadas em tempo real. Usuários administradores possuem permissões mestre ignorando esta tabela por segurança.
        </div>
      </div>
    </div>
  );
};

export default GroupManagement;
