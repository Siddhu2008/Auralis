import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Calendar, CheckSquare, Sparkles, Clock, AlertCircle, MoreHorizontal, Trash2, CheckCircle2
} from 'lucide-react';
import { apiFetch } from '../api';
import { useToast } from '../components/ui/ToastProvider';
import PageTitle from '../components/PageTitle';
import { format } from 'date-fns';

const PriorityBadge = ({ priority }) => {
  const styles = {
    high: "bg-red-500/10 text-red-400 border-red-500/20",
    normal: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    low: "bg-slate-500/10 text-slate-400 border-slate-500/20"
  };
  return (
    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[priority || 'normal']}`}>
      {priority}
    </span>
  );
};

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'normal', deadline: '', description: '' });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await apiFetch('/api/tasks');
      const data = await res.json();
      if (res.ok) {
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          priority: newTask.priority,
          due_at: newTask.deadline,
          description: newTask.description
        })
      });
      if (res.ok) {
        addToast({ type: 'success', title: 'Task Created' });
        setShowAddModal(false);
        setNewTask({ title: '', priority: 'normal', deadline: '', description: '' });
        fetchTasks();
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to create task.' });
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, progress: newStatus === 'completed' ? 100 : 0 })
      });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id) => {
    try {
      const res = await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // Organize by Kanban columns (To Do, In Progress, Done)
  // Our backend uses pending / completed. We'll map 'pending' to 'To Do', and let's synthetically split pending based on progress if available, or just mock it into In Progress for UI demonstration.
  // Actually, we can use the 'progress' field (if > 0 && < 100 it's In Progress).
  const columns = {
    'To Do': tasks.filter(t => t.status !== 'completed'),
    'Done': tasks.filter(t => t.status === 'completed')
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, columnName) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    
    // Map column to status
    let newStatus = 'pending';
    if (columnName === 'Done') newStatus = 'completed';
    
    updateTaskStatus(taskId, newStatus);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageTitle title="Tasks" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Task Management</h1>
          <p className="text-[var(--txt-secondary)] text-sm">Organize your workflow autonomously.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-gradient px-4 py-2 text-sm font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="flex items-start gap-6 overflow-x-auto pb-4 scrollbar-custom h-full min-h-[60vh]">
        {Object.entries(columns).map(([columnName, columnTasks]) => (
          <div 
            key={columnName} 
            className="flex-shrink-0 w-80 md:w-96 flex flex-col gap-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, columnName)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between font-semibold text-white">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  columnName === 'To Do' ? 'bg-slate-500' : 'bg-emerald-500'
                }`} />
                {columnName}
              </div>
              <span className="bg-[var(--bg-card)] border border-[var(--glass-border)] text-[var(--txt-secondary)] w-6 h-6 flex items-center justify-center rounded-full text-xs">
                {columnTasks.length}
              </span>
            </div>

            {/* Task Cards */}
            <div className="flex flex-col gap-3 flex-1 min-h-[150px] bg-[var(--bg-card)]/50 rounded-2xl p-2 border border-[var(--glass-border)] border-dashed">
              <AnimatePresence>
                {columnTasks.map((task) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="premium-card p-4 rounded-xl cursor-grab active:cursor-grabbing group hover:border-[var(--primary)]/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <PriorityBadge priority={task.priority} />
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {task.status !== 'completed' && (
                          <input 
                            type="checkbox"
                            checked={false}
                            onChange={() => updateTaskStatus(task.id, 'completed')} 
                            className="w-4 h-4 cursor-pointer accent-emerald-500 rounded border-white/20"
                            title="Mark as Done"
                          />
                        )}
                        <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-300" title="Delete Task">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className={`font-semibold text-white text-sm mb-2 flex items-center gap-2 ${task.status === 'completed' ? 'line-through text-[var(--txt-secondary)]' : ''}`}>
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-xs text-[var(--txt-secondary)] mb-4 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-[var(--txt-secondary)] font-medium">
                      <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                        <Calendar className="w-3 h-3" />
                        {task.due_at && !isNaN(new Date(task.due_at).getTime()) 
                          ? format(new Date(task.due_at), 'MMM d') 
                          : 'No deadline'}
                      </div>
                      
                      {/* AI Suggestion Badge (Mock) */}
                      {task.status !== 'completed' && task.priority === 'high' && (
                        <div className="flex items-center gap-1 text-[var(--accent)]" title="AI suggests prioritizing this">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg premium-card p-8 rounded-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Create New Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--txt-secondary)] uppercase mb-2 block">Task Title</label>
                  <input autoFocus value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required type="text" className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] text-white" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[var(--txt-secondary)] uppercase mb-2 block">Priority</label>
                    <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] text-white">
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--txt-secondary)] uppercase mb-2 block">Deadline</label>
                    <input 
                      value={newTask.deadline} 
                      onChange={e => setNewTask({...newTask, deadline: e.target.value})} 
                      type="datetime-local" 
                      min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                      className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] text-white" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--txt-secondary)] uppercase mb-2 block">Description</label>
                  <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} rows={3} className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] text-white" />
                </div>

                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl text-white font-semibold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 btn-gradient rounded-xl font-semibold">Deploy</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
