
import React from 'react';
import { User, GroupPermissions } from '../types';
import { UserPlus, Edit2, Trash2, Shield, Mail, Briefcase, CheckCircle, XCircle } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  groups: GroupPermissions[];
  onUpdateUser: (user: User) => void;
  onAddUser: () => void;
  onEditUser: (user: User) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, groups, onUpdateUser, onAddUser, onEditUser }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Usuários</h2>
          <p className="text-slate-500">Controle quem acessa a plataforma e seus respectivos setores</p>
        </div>
        <button 
          onClick={onAddUser}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-100"
        >
          <UserPlus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">Contato / Setor</th>
              <th className="px-6 py-4">Grupos de Acesso</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" alt="" />
                    <div>
                      <p className="font-bold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-400">ID: {user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Mail className="w-3 h-3" /> {user.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Briefcase className="w-3 h-3" /> {user.sector}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.groupIds.map(gid => {
                      const group = groups.find(g => g.id === gid);
                      return (
                        <span key={gid} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold border border-blue-100 flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" /> {group?.name}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.active ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                      <CheckCircle className="w-4 h-4" /> Ativo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                      <XCircle className="w-4 h-4" /> Inativo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onEditUser(user)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onUpdateUser({...user, active: !user.active})}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
