"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "../../../lib/auth-context";

export default function OrganizationPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [directorates, setDirectorates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters for Users Tab
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [filterUserRole, setFilterUserRole] = useState("all");

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editUserId, setEditUserId] = useState('');
  const [userFormData, setUserFormData] = useState({
    username: '', email: '', firstName: '', lastName: '', password: '', systemRole: 'STAFF', directorateId: 'none', unitId: 'none'
  });

  // Structure Modal State
  const [isDirModalOpen, setIsDirModalOpen] = useState(false);
  const [isEditDirOpen, setIsEditDirOpen] = useState(false);
  const [editDirId, setEditDirId] = useState('');
  const [dirFormData, setDirFormData] = useState({ name: '', description: '' });

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isEditUnitOpen, setIsEditUnitOpen] = useState(false);
  const [editUnitId, setEditUnitId] = useState('');
  const [unitFormData, setUnitFormData] = useState({ name: '', directorateId: '' });

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetchApi('/organization/users').then(setUsers).catch(console.error),
      fetchApi('/organization/directorates').then(setDirectorates).catch(console.error),
    ]).finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...userFormData } as any;
      if (payload.directorateId === 'none') payload.directorateId = null;
      if (payload.unitId === 'none') payload.unitId = null;

      await fetchApi('/organization/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setIsUserModalOpen(false);
      setUserFormData({ username: '', email: '', firstName: '', lastName: '', password: '', systemRole: 'STAFF', directorateId: 'none', unitId: 'none' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...userFormData } as any;
      if (payload.directorateId === 'none') payload.directorateId = null;
      if (payload.unitId === 'none') payload.unitId = null;
      if (!payload.password) delete payload.password; // Don't send empty password

      await fetchApi(`/organization/users/${editUserId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setIsEditUserOpen(false);
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetchApi(`/organization/users/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) { console.error(err); }
  };

  const openEditUser = (u: any) => {
    setEditUserId(u.id);
    setUserFormData({
      username: u.username, email: u.email, firstName: u.firstName, lastName: u.lastName, password: '', systemRole: u.systemRole, 
      directorateId: u.directorate?.id || 'none', unitId: u.unit?.id || 'none'
    });
    setIsEditUserOpen(true);
  };

  const handleCreateDirectorate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/organization/directorates', {
        method: 'POST',
        body: JSON.stringify(dirFormData),
      });
      setIsDirModalOpen(false);
      setDirFormData({ name: '', description: '' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditDirSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi(`/organization/directorates/${editDirId}`, { method: 'PUT', body: JSON.stringify(dirFormData) });
      setIsEditDirOpen(false);
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteDir = async (id: string) => {
    if (!confirm('Are you sure? This might fail if it has units or users attached.')) return;
    try {
      await fetchApi(`/organization/directorates/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) { 
      console.error(err); 
      alert("Failed to delete. Make sure there are no units or users associated with this directorate.");
    }
  };

  const openEditDir = (d: any) => {
    setEditDirId(d.id);
    setDirFormData({ name: d.name, description: d.description || '' });
    setIsEditDirOpen(true);
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/organization/units', {
        method: 'POST',
        body: JSON.stringify(unitFormData),
      });
      setIsUnitModalOpen(false);
      setUnitFormData({ name: '', directorateId: '' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi(`/organization/units/${editUnitId}`, { method: 'PUT', body: JSON.stringify(unitFormData) });
      setIsEditUnitOpen(false);
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await fetchApi(`/organization/units/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) { 
      console.error(err); 
      alert("Failed to delete. Make sure there are no users associated with this unit.");
    }
  };

  const openEditUnit = (u: any, dirId: string) => {
    setEditUnitId(u.id);
    setUnitFormData({ name: u.name, directorateId: dirId });
    setIsEditUnitOpen(true);
  };

  if (isLoading) return <div>Loading organization data...</div>;

  const isAdmin = user?.systemRole === 'ADMIN';

  // Derived state for the selected directorate's units
  const selectedDirectorate = directorates.find(d => d.id === userFormData.directorateId);
  const availableUnits = selectedDirectorate?.units || [];

  const filteredUsers = users.filter(u => {
    if (filterUserRole !== "all" && u.systemRole !== filterUserRole) return false;
    if (searchUserQuery) {
      const q = searchUserQuery.toLowerCase();
      const name = `${u.firstName} ${u.lastName}`.toLowerCase();
      if (!name.includes(q) && !u.username.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization Administration</h1>
          <p className="text-muted-foreground">Manage directory, users, and hierarchy.</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Structure
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          {isAdmin && (
            <div className="flex justify-end mb-4 mt-4">
              <Dialog open={isUserModalOpen} onOpenChange={(val) => {
                setIsUserModalOpen(val);
                if(val) setUserFormData({ username: '', email: '', firstName: '', lastName: '', password: '', systemRole: 'STAFF', directorateId: 'none', unitId: 'none' });
              }}>
                <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                  + Create User
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input required value={userFormData.firstName} onChange={e => setUserFormData({...userFormData, firstName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input required value={userFormData.lastName} onChange={e => setUserFormData({...userFormData, lastName: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input required value={userFormData.username} onChange={e => setUserFormData({...userFormData, username: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" required value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" placeholder="Leave empty for default" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={userFormData.systemRole} onValueChange={v => setUserFormData({...userFormData, systemRole: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STAFF">Staff</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="DIRECTOR">Director</SelectItem>
                          <SelectItem value="CEO">CEO</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 border-t pt-4">
                      <Label>Department (Directorate)</Label>
                      <Select value={userFormData.directorateId} onValueChange={v => setUserFormData({...userFormData, directorateId: v, unitId: 'none'})}>
                        <SelectTrigger><SelectValue placeholder="Select Department..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- No Department --</SelectItem>
                          {directorates.map(dir => (
                            <SelectItem key={dir.id} value={dir.id}>{dir.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {availableUnits.length > 0 && (
                      <div className="space-y-2 pb-2">
                        <Label>Unit (Optional)</Label>
                        <Select value={userFormData.unitId} onValueChange={v => setUserFormData({...userFormData, unitId: v})}>
                          <SelectTrigger><SelectValue placeholder="Select Unit..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- No Unit --</SelectItem>
                            {availableUnits.map((unit: any) => (
                              <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button type="submit" className="w-full">Create User</Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEditUserSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input required value={userFormData.firstName} onChange={e => setUserFormData({...userFormData, firstName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input required value={userFormData.lastName} onChange={e => setUserFormData({...userFormData, lastName: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input required value={userFormData.username} onChange={e => setUserFormData({...userFormData, username: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" required value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" placeholder="Leave empty to keep unchanged" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={userFormData.systemRole} onValueChange={v => setUserFormData({...userFormData, systemRole: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STAFF">Staff</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="DIRECTOR">Director</SelectItem>
                          <SelectItem value="CEO">CEO</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 border-t pt-4">
                      <Label>Department (Directorate)</Label>
                      <Select value={userFormData.directorateId} onValueChange={v => setUserFormData({...userFormData, directorateId: v, unitId: 'none'})}>
                        <SelectTrigger><SelectValue placeholder="Select Department..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- No Department --</SelectItem>
                          {directorates.map(dir => (
                            <SelectItem key={dir.id} value={dir.id}>{dir.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {availableUnits.length > 0 && (
                      <div className="space-y-2 pb-2">
                        <Label>Unit (Optional)</Label>
                        <Select value={userFormData.unitId} onValueChange={v => setUserFormData({...userFormData, unitId: v})}>
                          <SelectTrigger><SelectValue placeholder="Select Unit..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- No Unit --</SelectItem>
                            {availableUnits.map((unit: any) => (
                              <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button type="submit" className="w-full">Save Changes</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <div className="flex flex-wrap gap-4 items-end mb-4">
            <div className="w-64 space-y-1">
              <Label>Search Users</Label>
              <Input 
                placeholder="Search by name or username..." 
                value={searchUserQuery} 
                onChange={(e) => setSearchUserQuery(e.target.value)} 
              />
            </div>
            <div className="w-48 space-y-1">
              <Label>Role</Label>
              <Select value={filterUserRole} onValueChange={setFilterUserRole}>
                <SelectTrigger><SelectValue placeholder="All Roles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="DIRECTOR">Director</SelectItem>
                  <SelectItem value="CEO">CEO</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border bg-white mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Unit</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="text-center h-24 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.firstName} {u.lastName}
                    </TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell><Badge variant="outline">{u.systemRole}</Badge></TableCell>
                    <TableCell>{u.directorate?.name || '-'}</TableCell>
                    <TableCell>{u.unit?.name || '-'}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditUser(u)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="structure">
          {isAdmin && (
            <div className="flex gap-4 justify-end mt-4">
              <Dialog open={isDirModalOpen} onOpenChange={(val) => {
                setIsDirModalOpen(val);
                if (val) setDirFormData({ name: '', description: '' });
              }}>
                <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                  + Add Directorate
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Directorate</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateDirectorate} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input required value={dirFormData.name} onChange={e => setDirFormData({...dirFormData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={dirFormData.description} onChange={e => setDirFormData({...dirFormData, description: e.target.value})} />
                    </div>
                    <Button type="submit" className="w-full">Create</Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditDirOpen} onOpenChange={setIsEditDirOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Directorate</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEditDirSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input required value={dirFormData.name} onChange={e => setDirFormData({...dirFormData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={dirFormData.description} onChange={e => setDirFormData({...dirFormData, description: e.target.value})} />
                    </div>
                    <Button type="submit" className="w-full">Save Changes</Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isUnitModalOpen} onOpenChange={(val) => {
                setIsUnitModalOpen(val);
                if (val) setUnitFormData({ name: '', directorateId: '' });
              }}>
                <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                  + Add Unit
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Unit</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateUnit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input required value={unitFormData.name} onChange={e => setUnitFormData({...unitFormData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Parent Directorate</Label>
                      <Select required value={unitFormData.directorateId} onValueChange={v => setUnitFormData({...unitFormData, directorateId: v})}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {directorates.map(dir => (
                            <SelectItem key={dir.id} value={dir.id}>{dir.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full">Create</Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditUnitOpen} onOpenChange={setIsEditUnitOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Unit</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEditUnitSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input required value={unitFormData.name} onChange={e => setUnitFormData({...unitFormData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Parent Directorate</Label>
                      <Select required value={unitFormData.directorateId} onValueChange={v => setUnitFormData({...unitFormData, directorateId: v})}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {directorates.map(dir => (
                            <SelectItem key={dir.id} value={dir.id}>{dir.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full">Save Changes</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <div className="space-y-6 mt-4">
            {directorates.map(directorate => (
              <div key={directorate.id} className="p-4 border rounded-md bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-slate-500" />
                      {directorate.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{directorate.description}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDir(directorate)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDir(directorate.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="pl-6 border-l-2 border-slate-200 space-y-2">
                  {directorate.units?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No units defined.</p>
                  ) : (
                    directorate.units?.map((unit: any) => (
                      <div key={unit.id} className="flex justify-between items-center py-2 border-b last:border-0 group">
                        <span className="font-medium text-sm">{unit.name}</span>
                        {isAdmin && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditUnit(unit, directorate.id)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteUnit(unit.id)}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
