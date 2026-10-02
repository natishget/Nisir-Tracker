"use client";

import { useAuth } from "../../../lib/auth-context";
import { useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportsPage() {
  const { user } = useAuth();
  
  const isAdmin = user?.systemRole === 'ADMIN';
  const isCEO = user?.systemRole === 'CEO';
  const isDirector = user?.systemRole === 'DIRECTOR';
  const isManager = user?.systemRole === 'MANAGER';
  
  const hasTeam = isAdmin || isCEO || isDirector || isManager;
  
  const [activeTab, setActiveTab] = useState(isAdmin ? "team-reports" : "my-reports");
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [filterDirectorate, setFilterDirectorate] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    
    // Determine endpoint based on tab/role
    let endpoint = '/reports/me';
    if (isAdmin) {
      endpoint = '/reports/all';
    } else if (hasTeam && activeTab === 'team-reports') {
      endpoint = '/reports/team';
    }

    setIsLoading(true);
    fetchApi(endpoint)
      .then(setReports)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user, activeTab, isAdmin, hasTeam]);

  if (isLoading && reports.length === 0) return <div>Loading reports...</div>;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'APPROVED': return <Badge className="bg-green-500">Approved</Badge>;
      case 'REVIEWED': return <Badge className="bg-blue-500">Reviewed</Badge>;
      case 'SUBMITTED': return <Badge className="bg-purple-500">Submitted</Badge>;
      case 'LOCKED': return <Badge variant="secondary">Locked</Badge>;
      default: return <Badge variant="outline">Draft</Badge>;
    }
  };

  const isTeamView = isAdmin || (hasTeam && activeTab === 'team-reports');

  // Derive filter options based on view
  const directorates = Array.from(new Set(reports.map(r => r.author?.directorate?.name).filter(Boolean)));
  const availableUnits = Array.from(new Set(
    reports
      .filter(r => filterDirectorate === 'all' || r.author?.directorate?.name === filterDirectorate)
      .map(r => r.author?.unit?.name)
      .filter(Boolean)
  ));

  const filteredReports = reports.filter(r => {
    if (isAdmin && filterDirectorate !== 'all' && r.author?.directorate?.name !== filterDirectorate) return false;
    if (isTeamView && filterUnit !== 'all' && r.author?.unit?.name !== filterUnit) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchQuery) {
      const authorName = `${r.author?.firstName || ''} ${r.author?.lastName || ''}`.toLowerCase();
      if (!authorName.includes(searchQuery.toLowerCase()) && !r.period.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const reportTable = (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div className="w-64 space-y-1">
          <Label>Search Reports</Label>
          <Input placeholder="Search by author or period..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="w-48 space-y-1">
          <Label>Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="LOCKED">Locked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isAdmin && (
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
        
        {isTeamView && (isAdmin || isDirector) && availableUnits.length > 0 && (
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

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period Type</TableHead>
              {isTeamView && <TableHead>Author</TableHead>}
              {isTeamView && <TableHead>Department</TableHead>}
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={isTeamView ? 8 : 6} className="text-center h-24 text-muted-foreground">
                   Loading...
                 </TableCell>
               </TableRow>
            ) : filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isTeamView ? 8 : 6} className="text-center h-24 text-muted-foreground">
                  No reports found.
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.period}</TableCell>
                  {isTeamView && <TableCell>{report.author?.firstName} {report.author?.lastName}</TableCell>}
                  {isTeamView && <TableCell>{report.author?.directorate?.name || '-'} {report.author?.unit ? `(${report.author.unit.name})` : ''}</TableCell>}
                  <TableCell>{format(new Date(report.periodStart), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{format(new Date(report.periodEnd), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>{format(new Date(report.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
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
          <h1 className="text-2xl font-bold tracking-tight">
            {isAdmin ? 'All Reports' : 'Reports'}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Monitor performance reports across the organization.' 
              : 'View and manage performance reports.'}
          </p>
        </div>
        {!isAdmin && (
          <Link href="/dashboard/reports/new" className={buttonVariants({ variant: "default" })}>
            + Create Report
          </Link>
        )}
      </div>

      {!isAdmin && hasTeam ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="my-reports">My Reports</TabsTrigger>
            <TabsTrigger value="team-reports">Team Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="my-reports">{reportTable}</TabsContent>
          <TabsContent value="team-reports">{reportTable}</TabsContent>
        </Tabs>
      ) : (
        reportTable
      )}
    </div>
  );
}
