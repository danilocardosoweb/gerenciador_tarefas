
import React, { useState } from 'react';
import { GroupPermissions, UserRole } from '../types';
import GroupManagement from './GroupManagement';
import { 
  Shield, 
  Settings as SettingsIcon, 
  Database, 
  Bell, 
  Lock,
  Factory,
  CheckCircle2
} from 'lucide-react';

interface SettingsPageProps {
  groups: GroupPermissions[];
  onUpdatePermissions: (groupId: string, perms: Partial<GroupPermissions>) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ groups, onUpdatePermissions }) => {
  const [activeSubTab, setActiveSubTab] = useState<'permissions' | 'industrial' | 'system'>('permissions');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Configurações do Sistema</h2>
          <p className="text-slate-500">Gerencie diretrizes de segurança, setores e parâmetros operacionais</p>
        </div>
      </div>

      {/* Tabs Internas */}
      <div className="flex gap-1 p-1 bg-slate-200/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab('permissions')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeSubTab === 'permissions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" /> Matriz de Acessos
        </button>
        <button
          onClick={() => setActiveSubTab('industrial')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeSubTab === 'industrial' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Factory className="w-4 h-4" /> Parâmetros Industriais
        </button>
        <button
          onClick={() => setActiveSubTab('system')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeSubTab === 'system' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className="w-4 h-4" /> Sistema & API
        </button>
      </div>

      <div className="mt-6">
        {activeSubTab === 'permissions' && (
          <GroupManagement groups={groups} onUpdatePermissions={onUpdatePermissions} />
        )}

        {activeSubTab === 'industrial' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-blue-500" /> Setores Operacionais
              </h3>
              <div className="space-y-3">
                {Object.values(UserRole).map(role => (
                  <div key={role} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-sm font-medium text-slate-700">{role}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">Ativo</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" /> Notificações de Produção
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Alertas de Atraso</p>
                    <p className="text-xs text-slate-500">Notificar PCP em caso de tarefas críticas vencidas</p>
                  </div>
                  <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                    <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Relatórios Diários</p>
                    <p className="text-xs text-slate-500">Enviar resumo das OPs finalizadas por e-mail</p>
                  </div>
                  <div className="w-10 h-6 bg-slate-200 rounded-full relative">
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'system' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Configurações de Integração</h3>
            <p className="text-slate-500 max-w-md mx-auto mt-2">
              Configure chaves de API para integração com ERP, exportação automática para Power BI e backups de dados.
            </p>
            <button className="mt-6 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold transition-all">
              Configurar Webhooks
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
