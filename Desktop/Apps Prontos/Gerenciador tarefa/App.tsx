
import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import TaskModal from './components/TaskModal';
import UserManagement from './components/UserManagement';
import UserModal from './components/UserModal';
import SettingsPage from './components/SettingsPage';
import NotificationsCenter from './components/NotificationsCenter';
import { Task, User, GroupPermissions, AppNotification } from './types';
import { MOCK_TASKS, MOCK_USERS, DEFAULT_GROUPS } from './constants';
import { canViewTask } from './services/authService';
import { 
  Bell, 
  Search, 
  Menu,
  ChevronRight,
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS as Task[]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS as User[]);
  const [groups, setGroups] = useState<GroupPermissions[]>(DEFAULT_GROUPS);
  
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: 'n1', title: 'Atividade Atrasada', message: 'A OP-5582 está com o prazo vencido há 2 dias.', type: 'alert', date: new Date().toISOString(), read: false },
    { id: 'n2', title: 'Novo Comentário', message: 'João Santos comentou na sua solicitação de usinagem.', type: 'info', date: new Date().toISOString(), read: false }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  
  const [searchTerm, setSearchTerm] = useState('');

  // Simulando usuário logado
  const [currentUser] = useState<User>(MOCK_USERS[0] as User);

  const visibleTasks = useMemo(() => {
    return tasks.filter(task => {
      const isVisible = canViewTask(currentUser, task, groups);
      const term = searchTerm.toLowerCase();
      
      const matchesSearch = 
        (task.description || '').toLowerCase().includes(term) ||
        (task.productProfile || '').toLowerCase().includes(term) ||
        (task.opNumber || '').toLowerCase().includes(term);
      
      return isVisible && matchesSearch;
    });
  }, [tasks, currentUser, groups, searchTerm]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleSaveUser = (userData: User) => {
    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...userData, id: u.id } : u));
    } else {
      const newUser = {
        ...userData,
        id: `u-${Math.floor(100 + Math.random() * 900)}`,
        avatar: `https://i.pravatar.cc/150?u=${Math.random()}`,
      };
      setUsers(prev => [...prev, newUser]);
    }
    setIsUserModalOpen(false);
    setEditingUser(undefined);
  };

  const handleUpdatePermissions = (groupId: string, perms: Partial<GroupPermissions>) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...perms } : g));
  };

  const handleSaveTask = (taskData: Task) => {
    if (selectedTask) {
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...taskData, id: t.id } : t));
    } else {
      // Fix: Added missing 'type' property to TaskHistory entry and typed as Task to satisfy SetStateAction
      const newTask: Task = {
        ...taskData,
        id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
        requestorId: currentUser.id,
        attachments: [],
        history: [{
          id: Math.random().toString(),
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'Criação',
          timestamp: new Date().toISOString(),
          details: 'Tarefa criada no sistema',
          type: 'system'
        }],
      };
      setTasks(prev => [newTask, ...prev]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4 flex-1">
            <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative max-w-md w-full hidden sm:block">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Pesquisar por OP, produto ou descrição..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-blue-50 px-4 py-1.5 rounded-full flex items-center gap-2 border border-blue-100 mr-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">{currentUser.sector}</span>
            </div>
            <button 
              onClick={() => setActiveTab('notifications')}
              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="h-8 w-[1px] bg-slate-100 mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentUser.email.split('@')[0]}</p>
              </div>
              <img src={currentUser.avatar} className="w-10 h-10 rounded-2xl border-2 border-white shadow-md shadow-slate-200" alt="Profile" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-6 font-bold uppercase tracking-[0.2em]">
            <span>Tecnoperfil</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600">{activeTab}</span>
          </div>

          {activeTab === 'dashboard' && <Dashboard tasks={visibleTasks} />}
          
          {activeTab === 'kanban' && (
            <TaskBoard 
              tasks={visibleTasks} 
              onTaskClick={(task) => { setSelectedTask(task); setIsModalOpen(true); }} 
              onAddTask={() => { setSelectedTask(undefined); setIsModalOpen(true); }} 
            />
          )}

          {activeTab === 'users' && (
            <UserManagement 
              users={users} 
              groups={groups} 
              onUpdateUser={handleUpdateUser}
              onAddUser={() => { setEditingUser(undefined); setIsUserModalOpen(true); }}
              onEditUser={(user) => { setEditingUser(user); setIsUserModalOpen(true); }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage 
              groups={groups} 
              onUpdatePermissions={handleUpdatePermissions} 
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsCenter 
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onClearAll={() => setNotifications([])}
            />
          )}
        </div>
      </main>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        task={selectedTask} 
        onSave={handleSaveTask}
        availableUsers={users}
        availableGroups={groups}
      />

      <UserModal
        isOpen={isUserModalOpen}
        user={editingUser}
        groups={groups}
        onClose={() => { setIsUserModalOpen(false); setEditingUser(undefined); }}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default App;
