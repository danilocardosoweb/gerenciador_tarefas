
import React from 'react';
import { AppNotification } from '../types';
import { Bell, BellOff, Circle, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface NotificationsCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

const NotificationsCenter: React.FC<NotificationsCenterProps> = ({ notifications, onMarkAsRead, onClearAll }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Notificações</h2>
          <p className="text-slate-500">Acompanhe as atualizações das suas tarefas e alertas críticos</p>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={onClearAll}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-all"
          >
            Limpar tudo
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {notifications.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-6 flex items-start gap-4 transition-colors hover:bg-slate-50/50 ${!notif.read ? 'bg-blue-50/20' : ''}`}
                onClick={() => onMarkAsRead(notif.id)}
              >
                <div className={`p-2 rounded-xl shrink-0 ${
                  notif.type === 'alert' ? 'bg-rose-100 text-rose-600' : 
                  notif.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {notif.type === 'alert' ? <AlertCircle className="w-5 h-5" /> : 
                   notif.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800">{notif.title}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(notif.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{notif.message}</p>
                </div>
                {!notif.read && (
                  <Circle className="w-2.5 h-2.5 fill-blue-500 text-blue-500 shrink-0 mt-1" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
              <BellOff className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="text-slate-800 font-bold">Nenhuma notificação</p>
              <p className="text-slate-400 text-sm">Você está em dia com todas as suas atividades!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsCenter;
