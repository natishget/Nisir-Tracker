"use client";

import { useAuth } from "../../lib/auth-context";
import { useEffect, useState } from "react";
import { fetchApi } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, PlayCircle, Users, Building2, Layers, LayoutList } from "lucide-react";
import { FolderKanban } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [ceoStats, setCeoStats] = useState<any>(null);
  const [directorates, setDirectorates] = useState<any[]>([]);
  const [selectedDirectorate, setSelectedDirectorate] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    if (user.systemRole === 'ADMIN') {
      fetchApi('/organization/stats')
        .then(setAdminStats)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else if (user.systemRole === 'CEO') {
      Promise.all([
        fetchApi(selectedDirectorate !== 'all' ? `/organization/ceo-stats?directorateId=${selectedDirectorate}` : '/organization/ceo-stats').then(setCeoStats),
        fetchApi('/organization/directorates').then(setDirectorates)
      ])
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      fetchApi('/tasks/me')
        .then(setTasks)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [user, selectedDirectorate]);

  if (isLoading) return <div>Loading dashboard...</div>;

  // --- ADMIN VIEW ---
  if (user?.systemRole === 'ADMIN') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">System-wide organizational metrics.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats?.totalUsers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <LayoutList className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats?.totalTasks || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Directorates</CardTitle>
              <Building2 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats?.totalDirectorates || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Units</CardTitle>
              <Layers className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats?.totalUnits || 0}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- CEO VIEW ---
  if (user?.systemRole === 'CEO') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CEO Dashboard</h1>
            <p className="text-muted-foreground">Executive overview of projects and tasks.</p>
          </div>
          <div className="w-64">
            <select 
              className="w-full p-2 border rounded-md"
              value={selectedDirectorate}
              onChange={(e) => setSelectedDirectorate(e.target.value)}
            >
              <option value="all">All Directorates</option>
              {directorates.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ceoStats?.totalProjects || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ceoStats?.totalCompletedProjects || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <LayoutList className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ceoStats?.totalTasks || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">({ceoStats?.totalTasksUnderProjects || 0} in projects)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ceoStats?.totalCompletedTasks || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">To-Do Tasks</CardTitle>
              <Clock className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ceoStats?.totalToDoTasks || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ceoStats?.totalOverdueTasks || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1 border-dashed border-2 bg-slate-50/50 flex items-center justify-center min-h-[300px]">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Executive Reports</h3>
              <p className="text-sm text-muted-foreground">View and review reports submitted by directors.</p>
              <Link href="/dashboard/reports" className={buttonVariants({ variant: "default" })}>View Reports</Link>
            </div>
          </Card>
          <Card className="col-span-1 border-dashed border-2 bg-slate-50/50 flex items-center justify-center min-h-[300px]">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Projects Overview</h3>
              <p className="text-sm text-muted-foreground">Monitor the status and progress of all projects.</p>
              <Link href="/dashboard/projects" className={buttonVariants({ variant: "outline" })}>View Projects</Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // --- STAFF/MANAGER/DIRECTOR VIEW ---
  const toDos = tasks.filter(t => t.status === 'TO_DO');
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS');
  const blocked = tasks.filter(t => t.status === 'BLOCKED');
  const completed = tasks.filter(t => t.status === 'COMPLETED');
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const dueToday = tasks.filter(t => {
    if (!t.dueDate || t.status === 'COMPLETED') return false;
    const due = new Date(t.dueDate);
    due.setHours(0,0,0,0);
    return due.getTime() === today.getTime();
  });

  const overdue = tasks.filter(t => {
    if (!t.dueDate || t.status === 'COMPLETED') return false;
    const due = new Date(t.dueDate);
    due.setHours(0,0,0,0);
    return due.getTime() < today.getTime();
  });

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'LOW': return <Badge variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-200">Low</Badge>;
      case 'NORMAL': return <Badge variant="outline" className="text-slate-600">Normal</Badge>;
      case 'HIGH': return <Badge className="bg-orange-500 text-white hover:bg-orange-600">High</Badge>;
      case 'CRITICAL': return <Badge variant="destructive" className="bg-red-600 text-white hover:bg-red-700">Critical</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Good morning, {user?.firstName}</h1>
        <p className="text-muted-foreground">Here is what needs your attention today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toDos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <PlayCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blocked.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-red-600">Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            {overdue.length === 0 && dueToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">No urgent tasks.</p>
            ) : (
              <div className="space-y-4">
                {overdue.map(task => (
                  <div key={task.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{task.title}</p>
                        {getPriorityBadge(task.priority)}
                      </div>
                      <p className="text-sm text-red-500">Overdue</p>
                    </div>
                    <Link href="/dashboard/tasks" className={buttonVariants({ variant: "outline", size: "sm" })}>View</Link>
                  </div>
                ))}
                {dueToday.map(task => (
                  <div key={task.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{task.title}</p>
                        {getPriorityBadge(task.priority)}
                      </div>
                      <p className="text-sm text-orange-500">Due Today</p>
                    </div>
                    <Link href="/dashboard/tasks" className={buttonVariants({ variant: "outline", size: "sm" })}>View</Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1 border-dashed border-2 bg-slate-50/50 flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">Ready to start?</h3>
            <p className="text-sm text-muted-foreground">Check your full task list for what's next.</p>
            <Link href="/dashboard/tasks" className={buttonVariants({ variant: "default" })}>Go to My Tasks</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
