"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DirectoratePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && !["DIRECTOR", "CEO", "ADMIN"].includes(user.systemRole)) {
      router.push('/dashboard');
      return;
    }

    // Usually we would fetch a specific directorate ID.
    // For this prototype, we'll fetch directorates and take the first one or the one assigned to user.
    // However, the backend expects `directorate/:id` for tasks. Let's fetch the user's directorate tasks if available.
    // Since the API requires an ID, we'll fetch members and tasks using a placeholder or fetch directorates first.
    
    fetchApi('/organization/directorates')
      .then(directorates => {
        if (directorates.length > 0) {
          const defaultDirId = directorates[0].id;
          return Promise.all([
            fetchApi(`/tasks/directorate/${defaultDirId}`).then(setTasks),
            fetchApi(`/organization/directorate/${defaultDirId}/members`).then(setMembers)
          ]);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user, router]);

  if (isLoading) return <div>Loading directorate info...</div>;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'COMPLETED': return <Badge className="bg-green-500">Completed</Badge>;
      case 'IN_PROGRESS': return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'BLOCKED': return <Badge className="bg-orange-500">Blocked</Badge>;
      default: return <Badge variant="outline">To Do</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Directorate Overview</h1>
          <p className="text-muted-foreground">High-level view of tasks and personnel.</p>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Directorate Tasks</TabsTrigger>
          <TabsTrigger value="members">Personnel</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <div className="rounded-md border bg-white mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Name</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No tasks found in this directorate.
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{task.assignee?.firstName} {task.assignee?.lastName}</TableCell>
                      <TableCell>{task.unit?.name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>
                        {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="members">
          <div className="rounded-md border bg-white mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                    <TableCell><Badge variant="outline">{member.systemRole}</Badge></TableCell>
                    <TableCell>{member.position?.name || '-'}</TableCell>
                    <TableCell>{member.unit?.name || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
