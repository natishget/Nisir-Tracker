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
import { format } from "date-fns";
import { useAuth } from "../../../lib/auth-context";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TeamTasksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (user && !["MANAGER", "DIRECTOR", "CEO", "ADMIN"].includes(user.systemRole)) {
      router.push('/dashboard');
      return;
    }

    fetchApi('/tasks/team')
      .then(setTasks)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user, router]);

  if (isLoading) return <div>Loading team tasks...</div>;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'COMPLETED': return <Badge className="bg-green-500">Completed</Badge>;
      case 'IN_PROGRESS': return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'BLOCKED': return <Badge className="bg-orange-500">Blocked</Badge>;
      case 'SUBMITTED': return <Badge className="bg-purple-500">Submitted</Badge>;
      default: return <Badge variant="outline">To Do</Badge>;
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const title = t.title?.toLowerCase() || '';
      const assigneeName = `${t.assignee?.firstName || ''} ${t.assignee?.lastName || ''}`.toLowerCase();
      if (!title.includes(q) && !assigneeName.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Tasks</h1>
          <p className="text-muted-foreground">Overview of tasks assigned to your direct reports.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div className="w-64 space-y-1">
          <Label>Search Tasks</Label>
          <Input 
            placeholder="Search by task title or assignee..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
        <div className="w-48 space-y-1">
          <Label>Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="TO_DO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Name</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>{task.assignee?.firstName} {task.assignee?.lastName}</TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-500 mt-1">{task.progress}%</span>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
