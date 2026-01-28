
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Zap, 
  Sparkles,
  TrendingUp,
  History,
  Activity,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { getBottleneckAnalysis } from '../services/geminiService';

interface DashboardProps {
  tasks: Task[];
}

const Dashboard: React.FC<DashboardProps> = ({ tasks }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const kpis = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      urgent: tasks.filter(t => t.priority === TaskPriority.CRITICAL || t.priority === TaskPriority.HIGH).length,
      delayed: tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== TaskStatus.COMPLETED).length,
    };
  }, [tasks]);

  const handleExport = () => {
    const headers = ['ID', 'Tipo', 'Setor Responsável', 'Status', 'Prioridade', 'Prazo', 'OP', 'Perfil'];
    const rows = tasks.map(t => [t.id, t.type, t.responsibleSector, t.status, t.priority, t.deadline, t.opNumber, t.productProfile]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tecnoperfil_relatorio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(TaskStatus).forEach(s => counts[s] = 0);
    tasks.forEach(t => counts[t.status]++);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const sectorData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      counts[t.responsibleSector] = (counts[t.responsibleSector] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#a855f7'];

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await getBottleneckAnalysis(tasks);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Painel de Controle</h2>
          <p className="text-slate-500">Visão geral das operações da TecnoPerfil Alumínio</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl transition-all shadow-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button 
            onClick={handleAiAnalysis}
            disabled={loadingAi}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200 disabled:opacity-50 font-semibold"
          >
            {loadingAi ? <Clock className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loadingAi ? 'Analisando...' : 'Análise com IA'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Atividades Totais" value={kpis.total} icon={FileSpreadsheet} color="blue" />
        <KpiCard title="Em Execução" value={kpis.inProgress} icon={Clock} color="indigo" />
        <KpiCard title="Urgente / Crítica" value={kpis.urgent} icon={AlertTriangle} color="rose" />
        <KpiCard title="Atrasadas" value={kpis.delayed} icon={History} color="amber" />
      </div>

      {aiAnalysis && (
        <div className="bg-white border border-blue-100 p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
            <Sparkles className="w-32 h-32 text-blue-600" />
          </div>
          <div className="flex items-center gap-3 mb-4 text-blue-600 font-semibold">
            <Zap className="w-5 h-5 fill-current" />
            <span>Insights de Performance Industrial</span>
          </div>
          <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap italic">
            {aiAnalysis}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <Activity className="w-5 h-5 text-blue-500" /> Status das OPs
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" /> Carga por Setor
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ title: string; value: number; icon: any; color: string }> = ({ title, value, icon: Icon, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colorMap[color] || 'bg-slate-50 text-slate-600'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{title}</h3>
      <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
};

export default Dashboard;
