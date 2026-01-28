
import React from 'react';
import { 
  Plus, 
  MoreVertical, 
  Calendar, 
  Hash, 
  User, 
  Tag,
  AlertCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, StepStatus } from '../types';
import { STATUS_COLORS, PRIORITY_COLORS } from '../constants';

interface TaskBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onTaskClick, onAddTask }) => {
  const columns = Object.values(TaskStatus);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quadro de Operações</h2>
          <p className="text-slate-500">Fluxo de trabalho industrial em tempo real</p>
        </div>
        <button 
          onClick={onAddTask}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-xl shadow-blue-100 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova Atividade
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin h-full pr-8">
        {columns.map((status) => (
          <div key={status} className="flex-shrink-0 w-80 flex flex-col h-full bg-slate-100/40 rounded-3xl border border-slate-200/50 p-3">
            <div className="flex items-center justify-between mb-4 px-3 py-1">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                  status === TaskStatus.COMPLETED ? 'bg-emerald-500' : 
                  status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' : 'bg-slate-300'
                }`} />
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{status}</h3>
                <span className="bg-white text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-200">
                  {tasks.filter(t => t.status === status).length}
                </span>
              </div>
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-1">
              {tasks.filter(t => t.status === status).map((task) => {
                const completedSteps = task.steps?.filter(s => s.status === StepStatus.COMPLETED).length || 0;
                const totalSteps = task.steps?.length || 0;
                const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 cursor-pointer transition-all group animate-in fade-in slide-in-from-top-2 duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-[9px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded-md ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] text-slate-400 group-hover:text-blue-500 font-black tracking-widest transition-colors">#{task.id}</span>
                    </div>

                    <h4 className="text-slate-800 font-bold text-sm mb-4 line-clamp-2 leading-relaxed">
                      {task.description}
                    </h4>

                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <Hash className="w-3.5 h-3.5 text-blue-500" />
                        <span className="truncate">{task.productProfile}</span>
                      </div>
                      {task.opNumber && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <Tag className="w-3.5 h-3.5" />
                          <span className="font-bold">OP: {task.opNumber}</span>
                        </div>
                      )}
                    </div>

                    {totalSteps > 0 && (
                      <div className="mb-5 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>Fluxo de Etapas</span>
                          <span className={progress === 100 ? 'text-emerald-500' : 'text-blue-500'}>
                            {completedSteps}/{totalSteps}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                          <div 
                            className={`h-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(task.deadline).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex -space-x-2">
                         <div className="w-7 h-7 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-blue-600 shadow-sm" title={task.responsibleSector}>
                           {task.responsibleSector.substring(0, 2).toUpperCase()}
                         </div>
                         <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm" title="Criador">
                           {task.requestingSector.substring(0, 1).toUpperCase()}
                         </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {tasks.filter(t => t.status === status).length === 0 && (
                <div className="border-2 border-dashed border-slate-200/50 rounded-3xl h-32 flex flex-col items-center justify-center text-slate-400 gap-2 px-6 text-center">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center border border-slate-100 text-slate-200">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold italic">Nenhuma atividade ativa</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskBoard;
