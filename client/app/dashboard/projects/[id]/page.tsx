"use client";

import { useAuth } from "../../../../lib/auth-context";
import { useEffect, useState, use } from "react";
import { fetchApi } from "../../../../lib/api";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Users, LayoutList, FolderKanban } from "lucide-react";

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]); // To invite
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [taskData, setTaskData] = useState({ title: '', description: '', priority: 'NORMAL', dueDate: '', assigneeId: 'me' });

  const [isTaskCollabOpen, setIsTaskCollabOpen] = useState(false);
  const [taskToCollab, setTaskToCollab] = useState<string | null>(null);
  const [taskCollabUserId, setTaskCollabUserId] = useState('');

  const [isTaskViewOpen, setIsTaskViewOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);

  const { id } = use(params);
  
  const loadData = () => {
    setIsLoading(true);
    fetchApi(`/projects/${id}`)
      .then(p => {
        setProject(p);
        // If Director, load users in same directorate to invite
        if (p.creatorId === user?.id || user?.systemRole === 'ADMIN') {
          fetchApi('/organization/users')
            .then(users => {
              // Filter to users in same directorate (unless admin) who aren't already members
              const memberIds = p.members.map((m: any) => m.id);
              let possible = users.filter((u: any) => !memberIds.includes(u.id));
              if (user?.systemRole !== 'ADMIN') {
                possible = possible.filter((u: any) => u.directorate?.id === p.creator.directorateId);
              }
              setAvailableUsers(possible);
            });
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify({ userId: inviteUserId }) });
      setIsInviteOpen(false);
      setInviteUserId('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...taskData, projectId: id } as any;
      if (payload.assigneeId === 'me') delete payload.assigneeId;

      await fetchApi('/tasks', { method: 'POST', body: JSON.stringify(payload) });
      setIsTaskOpen(false);
      setTaskData({ title: '', description: '', priority: 'NORMAL', dueDate: '', assigneeId: 'me' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTaskCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi(`/tasks/${taskToCollab}/collaborators`, { method: 'POST', body: JSON.stringify({ userId: taskCollabUserId }) });
      setIsTaskCollabOpen(false);
      setTaskCollabUserId('');
      setTaskToCollab(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to add collaborator.");
    }
  };

  const handleCompleteProject = async () => {
    if (confirm("Are you sure you want to mark this project as complete? All tasks must be completed.")) {
      try {
        await fetchApi(`/projects/${id}/complete`, { method: 'PUT' });
        loadData();
      } catch (err: any) {
        alert(err.message || "Failed to complete project. Ensure all tasks are completed.");
      }
    }
  };

  if (isLoading) return <div>Loading project details...</div>;
  if (!project) return <div>Project not found.</div>;

  const isCreator = project.creatorId === user?.id || user?.systemRole === 'ADMIN';

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'LOW': return <Badge variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-200">Low</Badge>;
      case 'NORMAL': return <Badge variant="outline" className="text-slate-600">Normal</Badge>;
      case 'HIGH': return <Badge className="bg-orange-500 text-white hover:bg-orange-600">High</Badge>;
      case 'CRITICAL': return <Badge variant="destructive" className="bg-red-600 text-white hover:bg-red-700">Critical</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FolderKanban className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            {project.status === 'COMPLETED' ? (
              <Badge className="bg-green-500 ml-2">Completed</Badge>
            ) : (
              <Badge className="bg-blue-500 ml-2">In Progress</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        
        <div className="flex gap-2">
          {isCreator && project.status !== 'COMPLETED' && (
            <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50" onClick={handleCompleteProject}>
              Mark Project Complete
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Tasks Section */}
          <div className="border rounded-lg bg-white p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><LayoutList className="h-5 w-5" /> Project Tasks</h2>
              {project.status !== 'COMPLETED' && (
                <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
                  <DialogTrigger className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                    + Add Task
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Create Task for Project</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateTask} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input required value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} />
                      </div>
                      {(user?.systemRole === 'ADMIN' || user?.systemRole === 'DIRECTOR' || user?.systemRole === 'MANAGER') && (
                        <div className="space-y-2">
                          <Label>Assignee</Label>
                          <Select value={taskData.assigneeId} onValueChange={v => setTaskData({...taskData, assigneeId: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="me">Assign to me</SelectItem>
                              {project.members.map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.systemRole})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Button type="submit" className="w-full">Create Task</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Collaborators</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.tasks.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No tasks yet.</TableCell></TableRow>
                  ) : (
                    project.tasks.map((task: any) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                        <TableCell>{task.assignee?.firstName || '-'}</TableCell>
                        <TableCell>
                          {task.collaborators?.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {task.collaborators.map((c: any) => (
                                <Badge key={c.id} variant="secondary" className="text-xs">{c.firstName}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">None</span>
                          )}
                        </TableCell>
                        <TableCell><Badge variant="outline">{task.status}</Badge></TableCell>
                        <TableCell>{task.progress}%</TableCell>
                        <TableCell>{task.createdAt ? format(new Date(task.createdAt), 'MMM d, yyyy') : '-'}</TableCell>
                        <TableCell>{task.statusUpdatedAt ? format(new Date(task.statusUpdatedAt), 'MMM d, yyyy HH:mm') : '-'}</TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="text-primary hover:text-primary hover:bg-slate-50" onClick={() => { setCurrentTask(task); setIsTaskViewOpen(true); }}>
                            View
                          </Button>
                          {(isCreator || task.creatorId === user?.id) && project.status !== 'COMPLETED' && (
                            <Button variant="outline" size="sm" onClick={() => { setTaskToCollab(task.id); setIsTaskCollabOpen(true); }}>
                              + Collab
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Members Section */}
          <div className="border rounded-lg bg-white p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5" /> Team Members</h2>
              {isCreator && project.status !== 'COMPLETED' && (
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                  <DialogTrigger className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                    + Invite
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Invite Member</DialogTitle></DialogHeader>
                    <form onSubmit={handleInvite} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select User</Label>
                        <Select required value={inviteUserId} onValueChange={setInviteUserId}>
                          <SelectTrigger><SelectValue placeholder="Choose a user..." /></SelectTrigger>
                          <SelectContent>
                            {availableUsers.map(u => (
                              <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.systemRole})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full">Invite</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            <div className="space-y-3">
              {project.members.map((member: any) => (
                <div key={member.id} className="flex justify-between items-center">
                  <span className="font-medium text-sm">{member.firstName} {member.lastName} {member.id === project.creatorId && '(Creator)'}</span>
                  <Badge variant="secondary">{member.systemRole}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Task Collaborator Modal */}
      <Dialog open={isTaskCollabOpen} onOpenChange={setIsTaskCollabOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Collaborator to Task</DialogTitle></DialogHeader>
          <form onSubmit={handleAddTaskCollab} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Project Member</Label>
              <Select required value={taskCollabUserId} onValueChange={setTaskCollabUserId}>
                <SelectTrigger><SelectValue placeholder="Choose a member..." /></SelectTrigger>
                <SelectContent>
                  {project.members.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.systemRole})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Add Collaborator</Button>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* View Task Modal */}
      <Dialog open={isTaskViewOpen} onOpenChange={setIsTaskViewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Task Details</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Title</Label>
              <div className="font-medium text-lg">{currentTask?.title}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <div className="mt-1 whitespace-pre-wrap">{currentTask?.description || 'No description provided.'}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div><Badge variant="outline">{currentTask?.status}</Badge></div>
              </div>
              <div>
                <Label className="text-muted-foreground">Progress</Label>
                <div>{currentTask?.progress}%</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Start Date</Label>
                <div>{currentTask?.createdAt ? format(new Date(currentTask.createdAt), 'MMM d, yyyy h:mm a') : '-'}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Updated</Label>
                <div>{currentTask?.statusUpdatedAt ? format(new Date(currentTask.statusUpdatedAt), 'MMM d, yyyy h:mm a') : '-'}</div>
              </div>
            </div>
            
            {(currentTask?.creatorId === user?.id || user?.systemRole === 'ADMIN') && (
              <div className="pt-4 mt-4 border-t">
                <Button variant="destructive" className="w-full" onClick={async () => {
                  if (confirm("Are you sure you want to delete this task?")) {
                    try {
                      await fetchApi(`/tasks/${currentTask.id}`, { method: 'DELETE' });
                      setIsTaskViewOpen(false);
                      loadData();
                    } catch (err: any) {
                      alert(err.message || "Failed to delete task.");
                    }
                  }
                }}>Delete Task</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
