
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Save, AlertTriangle, FileText, Info, Eye, Users, Lock, 
  UserCircle, History, MessageSquare, Paperclip, CheckCircle2,
  Globe, Shield, User as UserIcon, Plus, ChevronRight, Play, Check, 
  Clock, Trash2, ArrowUpCircle, AlertCircle
} from 'lucide-react';
import { 
  Task, TaskType, TaskPriority, TaskStatus, UserRole, TaskVisibility, User, GroupPermissions, TaskStep, StepStatus, TaskHistory 
} from '../types';

interface TaskModalProps {
  task?: Partial<Task>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  availableUsers: User[];
  availableGroups: GroupPermissions[];
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  task, 
  isOpen, 
  onClose, 
  onSave, 
  availableUsers, 
  availableGroups 
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'workflow' | 'history' | 'attachments'>('info');
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStep, setNewStep] = useState<Partial<TaskStep>>({
    title: '',
    responsibleGroupId: availableGroups[0]?.id || '',
    status: StepStatus.PENDING
  });
  const [newComment, setNewComment] = useState('');

  // Simulando usuário logado (Carlos Silva Admin)
  const currentUser: User = availableUsers[0];

  useEffect(() => {
    if (isOpen) {
      setFormData(task || {
        type: TaskType.ROUTINE,
        requestingSector: UserRole.PCP,
        responsibleSector: UserRole.PRODUCTION,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.OPEN,
        visibility: TaskVisibility.GLOBAL,
        visibleGroupIds: [],
        visibleUserIds: [],
        openDate: new Date().toISOString(),
        deadline: new Date().toISOString().split('T')[0],
        followerIds: [],
        history: [],
        attachments: [],
        steps: [],
        description: '',
        productProfile: '',
        opNumber: ''
      });
      setActiveTab('info');
    }
  }, [task, isOpen, availableGroups]);

  const updateTaskStatusFromSteps = (steps: TaskStep[]): TaskStatus => {
    if (steps.length === 0) return formData.status || TaskStatus.OPEN;
    
    const allCompleted = steps.every(s => s.status === StepStatus.COMPLETED);
    if (allCompleted) return TaskStatus.COMPLETED;
    
    const anyInProgress = steps.some(s => s.status === StepStatus.IN_PROGRESS || s.status === StepStatus.COMPLETED);
    if (anyInProgress) return TaskStatus.IN_PROGRESS;
    
    return TaskStatus.OPEN;
  };

  const addHistoryEntry = (action: string, details: string, type: 'system' | 'manual' | 'step', comment?: string) => {
    const entry: TaskHistory = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details,
      timestamp: new Date().toISOString(),
      type,
      comment
    };
    setFormData(prev => ({
      ...prev,
      history: [entry, ...(prev.history || [])]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Task);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStep = () => {
    if (!newStep.title) return;
    const steps = [...(formData.steps || [])];
    const step: TaskStep = {
      id: Math.random().toString(36).substr(2, 9),
      title: newStep.title!,
      description: newStep.description,
      responsibleGroupId: newStep.responsibleGroupId!,
      status: StepStatus.PENDING,
      order: steps.length + 1
    };
    const updatedSteps = [...steps, step];
    setFormData({ 
      ...formData, 
      steps: updatedSteps,
      status: updateTaskStatusFromSteps(updatedSteps)
    });
    addHistoryEntry('Nova Etapa Criada', `Etapa "${step.title}" adicionada ao fluxo.`, 'step');
    setNewStep({ title: '', responsibleGroupId: availableGroups[0]?.id || '', status: StepStatus.PENDING });
    setIsAddingStep(false);
  };

  const updateStepStatus = (stepId: string, newStatus: StepStatus) => {
    const steps = (formData.steps || []).map(s => {
      if (s.id === stepId) {
        const updated = { ...s, status: newStatus };
        if (newStatus === StepStatus.COMPLETED) {
          updated.completedAt = new Date().toISOString();
          updated.completedBy = currentUser.name;
        }
        return updated;
      }
      return s;
    });

    const taskStatus = updateTaskStatusFromSteps(steps);
    setFormData({ ...formData, steps, status: taskStatus });
    
    const step = steps.find(s => s.id === stepId);
    addHistoryEntry('Status da Etapa Atualizado', `Etapa "${step?.title}" movida para ${newStatus}.`, 'step');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addHistoryEntry('Comentário Técnico', 'Novo apontamento registrado pelo usuário.', 'manual', newComment);
    setNewComment('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-100">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">
                {task?.id ? `Atividade ${task.id}` : 'Nova Atividade Industrial'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                  formData.status === TaskStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 
                  formData.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {formData.status}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">• TecnoPerfil Alumínio</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-2 flex gap-4 border-b border-slate-100 bg-white overflow-x-auto no-scrollbar">
          <ModalTab active={activeTab === 'info'} onClick={() => setActiveTab('info')} icon={Info} label="Informações" />
          <ModalTab active={activeTab === 'workflow'} onClick={() => setActiveTab('workflow')} icon={ChevronRight} label="Fluxo de Trabalho" count={formData.steps?.length} />
          <ModalTab active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Eventos & Timeline" />
          <ModalTab active={activeTab === 'attachments'} onClick={() => setActiveTab('attachments')} icon={Paperclip} label="Anexos" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30">
          {activeTab === 'info' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Atividade</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 bg-white shadow-sm outline-none">
                    {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prioridade</label>
                  <select name="priority" value={formData.priority} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 bg-white shadow-sm outline-none">
                    {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perfil de Alumínio</label>
                  <input name="productProfile" value={formData.productProfile} onChange={handleChange} placeholder="Ex: Perfil Estrutural 20x20" className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 bg-white shadow-sm outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Número da OP</label>
                  <input name="opNumber" value={formData.opNumber} onChange={handleChange} placeholder="Ex: OP-2024-550" className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 bg-white shadow-sm outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição das Instruções</label>
                <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 bg-white shadow-sm outline-none resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prazo de Entrega</label>
                  <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white outline-none" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nível de Acesso</label>
                  <select name="visibility" value={formData.visibility} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white outline-none">
                    <option value={TaskVisibility.GLOBAL}>🌎 Global (Acesso Livre)</option>
                    <option value={TaskVisibility.GROUP}>🛡️ Setorial (Grupos Específicos)</option>
                    <option value={TaskVisibility.PRIVATE}>🔒 Privado (Apenas Envolvidos)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-800">Passo a Passo Operacional</h3>
                  <p className="text-xs text-slate-500">Defina as etapas para conclusão da atividade</p>
                </div>
                <button 
                  onClick={() => setIsAddingStep(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-100"
                >
                  <Plus className="w-4 h-4" /> Adicionar Etapa
                </button>
              </div>

              {isAddingStep && (
                <div className="bg-white p-6 rounded-3xl border-2 border-blue-100 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Etapa</label>
                      <input 
                        value={newStep.title} 
                        onChange={e => setNewStep({...newStep, title: e.target.value})}
                        placeholder="Ex: Liberar Prensa" 
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor Responsável</label>
                      <select 
                        value={newStep.responsibleGroupId}
                        onChange={e => setNewStep({...newStep, responsibleGroupId: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none"
                      >
                        {availableGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAddingStep(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button onClick={handleAddStep} className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg shadow-md shadow-blue-100">Criar Etapa</button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {(formData.steps || []).length > 0 ? (
                  formData.steps?.sort((a, b) => a.order - b.order).map((step, idx) => {
                    const isPrevCompleted = idx === 0 || formData.steps![idx-1].status === StepStatus.COMPLETED;
                    const group = availableGroups.find(g => g.id === step.responsibleGroupId);
                    
                    return (
                      <div key={step.id} className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group transition-all ${step.status === StepStatus.COMPLETED ? 'opacity-70 bg-slate-50' : ''}`}>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black ${
                          step.status === StepStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' : 
                          step.status === StepStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {step.status === StepStatus.COMPLETED ? <Check className="w-5 h-5" /> : step.order}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-bold text-sm ${step.status === StepStatus.COMPLETED ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                              {step.title}
                            </h4>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase">{group?.name}</span>
                          </div>
                          {step.completedAt && (
                            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Finalizado por {step.completedBy} em {new Date(step.completedAt).toLocaleString()}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {step.status === StepStatus.PENDING && (
                            <button 
                              disabled={!isPrevCompleted}
                              onClick={() => updateStepStatus(step.id, StepStatus.IN_PROGRESS)}
                              className={`p-2 rounded-xl transition-all ${isPrevCompleted ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-300 cursor-not-allowed'}`}
                              title={isPrevCompleted ? "Iniciar Etapa" : "Etapa anterior pendente"}
                            >
                              <Play className="w-5 h-5" />
                            </button>
                          )}
                          {step.status === StepStatus.IN_PROGRESS && (
                            <button 
                              onClick={() => updateStepStatus(step.id, StepStatus.COMPLETED)}
                              className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-all"
                              title="Concluir Etapa"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                          )}
                          <button className="p-2 text-slate-300 hover:text-rose-500 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                    <ArrowUpCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold">Nenhuma etapa configurada</p>
                    <p className="text-xs text-slate-400">Clique em "Adicionar Etapa" para iniciar o fluxo industrial</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <MessageSquare className="w-4 h-4 text-blue-500" /> Registrar Apontamento
                </h3>
                <textarea 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Descreva observações técnicas, justificativas ou ocorrências..."
                  className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 text-sm resize-none"
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={handleAddComment}
                    className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-900 transition-all"
                  >
                    Registrar Evento
                  </button>
                </div>
              </div>

              <div className="relative space-y-8 pl-4 border-l-2 border-slate-100">
                {(formData.history || []).length > 0 ? (
                  formData.history?.map((event) => (
                    <div key={event.id} className="relative pl-8 group">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                        event.type === 'step' ? 'bg-blue-500' : event.type === 'manual' ? 'bg-amber-500' : 'bg-slate-400'
                      }`} />
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800">{event.userName}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(event.timestamp).toLocaleString()}</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                           event.type === 'step' ? 'text-blue-600' : event.type === 'manual' ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {event.action}
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">{event.details}</p>
                        {event.comment && (
                          <div className="mt-2 bg-slate-100 p-3 rounded-2xl border-l-4 border-slate-300 italic text-sm text-slate-700">
                            "{event.comment}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm italic">Nenhum evento registrado ainda.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="bg-white border-2 border-dashed border-slate-200 p-12 rounded-3xl flex flex-col items-center justify-center text-center gap-4 hover:border-blue-300 transition-all group">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Paperclip className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">Central de Evidências</p>
                  <p className="text-slate-400 text-sm">Arraste fotos de laudos, testes ou amostras aqui</p>
                </div>
                <label className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold cursor-pointer hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95">
                  Anexar Arquivos
                  <input type="file" className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button type="button" onClick={onClose} className="px-8 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition-all">Descartar</button>
          <button onClick={handleSubmit} className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-xl shadow-blue-200 transition-all active:scale-95">
            <Save className="w-4 h-4" /> Finalizar & Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

const ModalTab: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string; count?: number }> = ({ active, onClick, icon: Icon, label, count }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-4 border-b-2 transition-all font-bold text-xs uppercase tracking-widest whitespace-nowrap ${
      active ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-300'}`} />
    {label}
    {count !== undefined && (
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
        {count}
      </span>
    )}
  </button>
);

export default TaskModal;
