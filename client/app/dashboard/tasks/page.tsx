"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useAuth } from "../../../lib/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TasksPage() {
  const { user } = useAuth();
  
  const isAdmin = user?.systemRole === 'ADMIN';
  const isCEO = user?.systemRole === 'CEO';
  const isDirector = user?.systemRole === 'DIRECTOR';
  const isManager = user?.systemRole === 'MANAGER';
  const isGlobalView = isAdmin || isCEO;
  const hasTeam = isAdmin || isCEO || isDirector || isManager;
  
  const [activeTab, setActiveTab] = useState(isGlobalView ? 'team-tasks' : 'my-tasks');
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters for Admin
  const [filterDirectorate, setFilterDirectorate] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');

  // Universal Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '', description: '', priority: 'NORMAL', dueDate: '', assigneeId: 'me',
  });

  const [editFormData, setEditFormData] = useState({
    title: '', description: '', status: '', priority: '', progress: 0, dueDate: '',
  });

  const [collabUserId, setCollabUserId] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  const loadTasks = () => {
    setIsLoading(true);
    let endpoint = '/tasks/me';
    if (isGlobalView) {
      endpoint = '/tasks/all';
    } else if (hasTeam && activeTab === 'team-tasks') {
      endpoint = '/tasks/team';
    }
    
    Promise.all([
      fetchApi(endpoint).then(setTasks),
      !isGlobalView ? fetchApi('/organization/team').then(setAvailableUsers) : fetchApi('/organization/users').then(setAvailableUsers)
    ])
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user, activeTab]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData } as any;
      if (payload.assigneeId === 'me') delete payload.assigneeId;
      
      await fetchApi('/tasks', { method: 'POST', body: JSON.stringify(payload) });
      setIsCreateOpen(false);
      setFormData({ title: '', description: '', priority: 'NORMAL', dueDate: '', assigneeId: 'me' });
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (task: any) => {
    setCurrentTask(task);
    setEditFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setIsEditOpen(true);
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const detailsChanged = 
        editFormData.title !== currentTask.title ||
        editFormData.description !== (currentTask.description || '') ||
        editFormData.priority !== currentTask.priority ||
        editFormData.dueDate !== (currentTask.dueDate ? currentTask.dueDate.split('T')[0] : '');

      if (detailsChanged) {
        await fetchApi(`/tasks/${currentTask.id}`, { method: 'PUT', body: JSON.stringify(editFormData) });
      }

      await fetchApi(`/tasks/${currentTask.id}/progress`, { 
        method: 'PUT', body: JSON.stringify({ progress: editFormData.progress, status: editFormData.status }) 
      });
      
      setIsEditOpen(false);
      loadTasks();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update task');
    }
  };

  const handleAddCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabUserId) return;
    try {
      await fetchApi(`/tasks/${currentTask.id}/collaborators`, { method: 'POST', body: JSON.stringify({ userId: collabUserId }) });
      setCollabUserId('');
      loadTasks();
      alert('Collaborator added!');
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading && tasks.length === 0) return <div>Loading tasks...</div>;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'COMPLETED': return <Badge className="bg-green-500">Completed</Badge>;
      case 'IN_PROGRESS': return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'BLOCKED': return <Badge className="bg-orange-500">Blocked</Badge>;
      case 'SUBMITTED': return <Badge className="bg-purple-500">Submitted</Badge>;
      default: return <Badge variant="outline">To Do</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'LOW': return <Badge variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-200">Low</Badge>;
      case 'NORMAL': return <Badge variant="outline" className="text-slate-600">Normal</Badge>;
      case 'HIGH': return <Badge className="bg-orange-500 text-white hover:bg-orange-600">High</Badge>;
      case 'CRITICAL': return <Badge variant="destructive" className="bg-red-600 text-white hover:bg-red-700">Critical</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const isTeamView = isGlobalView || (hasTeam && activeTab === 'team-tasks');

  // Derive filter options for Admin / Directors
  const directorates = Array.from(new Set(tasks.map(t => t.directorate?.name).filter(Boolean)));
  
  const filteredTasks = tasks.filter(t => {
    if (isGlobalView && filterDirectorate !== 'all' && t.directorate?.name !== filterDirectorate) return false;
    if (isTeamView && filterUnit !== 'all' && t.unit?.name !== filterUnit) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const availableUnits = Array.from(new Set(
    tasks
      .filter(t => filterDirectorate === 'all' || t.directorate?.name === filterDirectorate)
      .map(t => t.unit?.name)
      .filter(Boolean)
  ));

  const taskTable = (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div className="w-64 space-y-1">
          <Label>Search Tasks</Label>
          <Input placeholder="Search by title..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="w-40 space-y-1">
          <Label>Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="TO_DO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-40 space-y-1">
          <Label>Priority</Label>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger><SelectValue placeholder="All Priorities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {isGlobalView && (
          <div className="w-48 space-y-1">
            <Label>Directorate</Label>
            <Select value={filterDirectorate} onValueChange={(v) => { setFilterDirectorate(v); setFilterUnit('all'); }}>
              <SelectTrigger><SelectValue placeholder="All Directorates" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directorates</SelectItem>
                {directorates.map((d: any) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {isTeamView && (isGlobalView || isDirector) && availableUnits.length > 0 && (
          <div className="w-48 space-y-1">
            <Label>Unit</Label>
            <Select value={filterUnit} onValueChange={setFilterUnit}>
              <SelectTrigger><SelectValue placeholder="All Units" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {availableUnits.map((u: any) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAdmin ? 'View/Edit Task' : 'Edit Task'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditTask} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input required value={editFormData.title} onChange={e => setEditFormData({...editFormData, title: e.target.value})} disabled={!isAdmin && currentTask?.creatorId !== user?.id} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} disabled={!isAdmin && currentTask?.creatorId !== user?.id} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-2">
              <div><strong>Start Date:</strong> {currentTask?.createdAt ? format(new Date(currentTask.createdAt), 'MMM d, yyyy h:mm a') : '-'}</div>
              <div><strong>Last Status Change:</strong> {currentTask?.statusUpdatedAt ? format(new Date(currentTask.statusUpdatedAt), 'MMM d, yyyy h:mm a') : '-'}</div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editFormData.status} onValueChange={v => setEditFormData({...editFormData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TO_DO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Progress (%)</Label>
              <Input type="number" min="0" max="100" value={editFormData.progress} onChange={e => setEditFormData({...editFormData, progress: parseInt(e.target.value)})} />
            </div>
            <Button type="submit" className="w-full">Save Changes</Button>
            
            {(currentTask?.creatorId === user?.id || isAdmin) && (
              <Button type="button" variant="destructive" className="w-full mt-2" onClick={async () => {
                if (confirm("Are you sure you want to delete this task?")) {
                  try {
                    await fetchApi(`/tasks/${currentTask.id}`, { method: 'DELETE' });
                    setIsEditOpen(false);
                    loadTasks();
                  } catch (err: any) {
                    alert(err.message || "Failed to delete task.");
                  }
                }
              }}>Delete Task</Button>
            )}
          </form>

          {!isAdmin && currentTask && (
            <div className="pt-4 border-t mt-4">
              <h4 className="text-sm font-medium mb-2">Add Collaborator</h4>
              <div className="flex gap-2">
                <Select value={collabUserId} onValueChange={setCollabUserId}>
                  <SelectTrigger><SelectValue placeholder="Select Staff..." /></SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleAddCollab}>Add</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Name</TableHead>
              <TableHead>Priority</TableHead>
              {isTeamView && <TableHead>Assignee</TableHead>}
              {isTeamView && <TableHead>Department</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={isTeamView ? 9 : 7} className="text-center h-24 text-muted-foreground">
                   Loading...
                 </TableCell>
               </TableRow>
            ) : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isTeamView ? 9 : 7} className="text-center h-24 text-muted-foreground">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  {isTeamView && <TableCell>{task.assignee?.firstName || '-'} {task.assignee?.lastName || ''}</TableCell>}
                  {isTeamView && <TableCell>{task.directorate?.name || '-'} {task.unit ? `(${task.unit.name})` : ''}</TableCell>}
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-500 mt-1">{task.progress}%</span>
                  </TableCell>
                  <TableCell>
                    {task.createdAt ? format(new Date(task.createdAt), 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    {task.statusUpdatedAt ? format(new Date(task.statusUpdatedAt), 'MMM d, yyyy HH:mm') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="text-primary hover:text-primary hover:bg-slate-50" onClick={() => openEditModal(task)}>View / Edit</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isGlobalView ? 'All Tasks (Global)' : 'Tasks'}</h1>
          <p className="text-muted-foreground">{isGlobalView ? 'Monitor all tasks across the organization.' : 'Manage your assigned work and team tasks.'}</p>
        </div>
        
        {user?.systemRole !== 'CEO' && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              + Create Task
            </DialogTrigger>
          <DialogContent>
              <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                {(isAdmin || isDirector || isManager) && (
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Select value={formData.assigneeId} onValueChange={v => setFormData({...formData, assigneeId: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="me">Assign to me</SelectItem>
                        {availableUsers.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.systemRole})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                  </div>
                </div>
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isGlobalView && hasTeam ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="team-tasks">Team Tasks</TabsTrigger>
          </TabsList>
          <TabsContent value="my-tasks">{taskTable}</TabsContent>
          <TabsContent value="team-tasks">{taskTable}</TabsContent>
        </Tabs>
      ) : (
        taskTable
      )}
    </div>
  );
}
