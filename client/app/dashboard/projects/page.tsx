"use client";

import { useAuth } from "../../../lib/auth-context";
import { useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { format } from "date-fns";
import Link from "next/link";
import { FolderKanban } from "lucide-react";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDirectorate, setFilterDirectorate] = useState("all");

  // Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', ownerId: 'me' });
  const [directors, setDirectors] = useState<any[]>([]);

  const isDirector = user?.systemRole === 'DIRECTOR' || user?.systemRole === 'ADMIN';
  const isAdmin = user?.systemRole === 'ADMIN';
  const isCEO = user?.systemRole === 'CEO';

  const loadProjects = () => {
    setIsLoading(true);
    Promise.all([
      fetchApi('/projects').then(setProjects),
      isAdmin ? fetchApi('/organization/users').then(users => setDirectors(users.filter((u: any) => u.systemRole === 'DIRECTOR' || u.systemRole === 'CEO'))) : Promise.resolve()
    ])
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData } as any;
      if (payload.ownerId === 'me') delete payload.ownerId;

      await fetchApi('/projects', { method: 'POST', body: JSON.stringify(payload) });
      setIsCreateOpen(false);
      setFormData({ name: '', description: '', ownerId: 'me' });
      loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div>Loading projects...</div>;

  const directorates = Array.from(new Set(projects.map(p => p.creator?.directorate?.name).filter(Boolean)));
  const filteredProjects = projects.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterDirectorate !== 'all' && p.creator?.directorate?.name !== filterDirectorate) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Collaborate on large-scale initiatives.</p>
        </div>
        
        {isDirector && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              + Create Project
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Project</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <Label>Project Owner (Director)</Label>
                    <Select value={formData.ownerId} onValueChange={v => setFormData({...formData, ownerId: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="me">Assign to me</SelectItem>
                        {directors.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.systemRole})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div className="w-64 space-y-1">
          <Label>Search Projects</Label>
          <Input 
            placeholder="Search by project name..." 
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
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(isAdmin || isCEO) && (
          <div className="w-64 space-y-1">
            <Label>Filter by Directorate</Label>
            <Select value={filterDirectorate} onValueChange={setFilterDirectorate}>
              <SelectTrigger><SelectValue placeholder="All Directorates" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directorates</SelectItem>
                {directorates.map((d: any) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.length === 0 ? (
          <p className="text-muted-foreground col-span-3">No projects found.</p>
        ) : (
          filteredProjects.map(project => (
            <div key={project.id} className="border rounded-lg p-6 bg-white shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <FolderKanban className="h-8 w-8 text-blue-500" />
                  {project.status === 'COMPLETED' ? (
                    <Badge className="bg-green-500">Completed</Badge>
                  ) : (
                    <Badge className="bg-blue-500">In Progress</Badge>
                  )}
                </div>
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{project.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description || 'No description provided.'}</p>
              </div>
              
              <div className="pt-4 border-t mt-4 flex justify-between items-center text-sm">
                <div className="text-muted-foreground">
                  By: {project.creator?.firstName} {project.creator?.lastName}
                  {project.creator?.directorate?.name ? ` (${project.creator.directorate.name})` : ''}
                </div>
                {!isCEO && (
                  <Link href={`/dashboard/projects/${project.id}`} className={`${buttonVariants({ variant: "outline", size: "sm" })} text-primary hover:text-primary hover:bg-slate-50`}>
                    View Details
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
