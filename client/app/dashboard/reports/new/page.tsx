"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "../../../../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateReportPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    period: 'WEEKLY',
    periodStart: '',
    periodEnd: '',
    completedTasks: 0,
    inProgressTasks: 0,
    blockedTasks: 0,
    overdueTasks: 0,
    notes: '',
    challenges: '',
    nextPeriodPlan: ''
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await fetchApi('/reports', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      router.push('/dashboard/reports');
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Report</h1>
        <p className="text-muted-foreground">Submit your performance report.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Period Type</Label>
                <Select value={formData.period} onValueChange={(v) => handleChange('period', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Period Start</Label>
                <Input type="date" required value={formData.periodStart} onChange={(e) => handleChange('periodStart', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Period End</Label>
                <Input type="date" required value={formData.periodEnd} onChange={(e) => handleChange('periodEnd', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Completed</Label>
                <Input type="number" min="0" value={formData.completedTasks} onChange={(e) => handleChange('completedTasks', parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>In Progress</Label>
                <Input type="number" min="0" value={formData.inProgressTasks} onChange={(e) => handleChange('inProgressTasks', parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Blocked</Label>
                <Input type="number" min="0" value={formData.blockedTasks} onChange={(e) => handleChange('blockedTasks', parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Overdue</Label>
                <Input type="number" min="0" value={formData.overdueTasks} onChange={(e) => handleChange('overdueTasks', parseInt(e.target.value))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes & Achievements</Label>
              <Textarea rows={4} value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Summarize key achievements..." />
            </div>

            <div className="space-y-2">
              <Label>Challenges & Blockers</Label>
              <Textarea rows={3} value={formData.challenges} onChange={(e) => handleChange('challenges', e.target.value)} placeholder="Describe any issues..." />
            </div>

            <div className="space-y-2">
              <Label>Plan for Next Period</Label>
              <Textarea rows={3} value={formData.nextPeriodPlan} onChange={(e) => handleChange('nextPeriodPlan', e.target.value)} placeholder="What will you focus on?" />
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
