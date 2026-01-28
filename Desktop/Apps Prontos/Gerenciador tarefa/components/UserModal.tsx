
import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus, Mail, Shield, Briefcase, Info } from 'lucide-react';
import { User, UserRole, GroupPermissions } from '../types';

interface UserModalProps {
  user?: Partial<User>;
  groups: GroupPermissions[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, groups, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    sector: UserRole.PRODUCTION,
    groupIds: [],
    active: true,
  });

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      setFormData({
        name: '',
        email: '',
        sector: UserRole.PRODUCTION,
        groupIds: [],
        active: true,
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as User);
  };

  const handleGroupToggle = (groupId: string) => {
    const currentGroups = formData.groupIds || [];
    if (currentGroups.includes(groupId)) {
      setFormData({ ...formData, groupIds: currentGroups.filter(id => id !== groupId) });
    } else {
      setFormData({ ...formData, groupIds: [...currentGroups, groupId] });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {user?.id ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Nome Completo *</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-all"
                placeholder="Ex: João da Silva"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">E-mail Corporativo *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-10 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-all"
                  placeholder="joao@tecnoperfil.com.br"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Setor Industrial *</label>
                <select
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value as UserRole })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                >
                  {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <div className="flex items-center gap-2 h-[46px]">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                    className={`w-12 h-6 rounded-full relative transition-all ${formData.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${formData.active ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-xs font-bold text-slate-500 uppercase">{formData.active ? 'Ativo' : 'Inativo'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" /> Grupos de Acesso (Perfis)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {groups.map(group => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleGroupToggle(group.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      formData.groupIds?.includes(group.id)
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                        : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      formData.groupIds?.includes(group.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                    }`}>
                      {formData.groupIds?.includes(group.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    {group.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0" />
            <p className="text-[11px] text-blue-700 leading-relaxed">
              O usuário receberá um convite por e-mail para definir sua senha de acesso. As permissões serão aplicadas imediatamente após o primeiro login.
            </p>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-100">
            <Save className="w-4 h-4" />
            {user?.id ? 'Atualizar Usuário' : 'Criar Usuário'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
