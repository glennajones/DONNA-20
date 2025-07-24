import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, Filter, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface CoachTimeLog {
  id: number;
  coachId: number;
  date: string;
  hours: string;
  notes: string | null;
  approved: boolean;
  submittedAt: string;
  approvedAt: string | null;
  approvedBy: number | null;
}

interface Coach {
  id: number;
  name: string;
  specialty: string;
}

export default function TimeLogApproval() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [coachFilter, setCoachFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all time logs
  const { data: timeLogs = [], isLoading } = useQuery<CoachTimeLog[]>({
    queryKey: ['/api/coach-time-logs'],
  });

  // Get coaches for filtering
  const { data: coaches = [] } = useQuery<Coach[]>({
    queryKey: ['/api/coaches'],
  });

  const approveTimeLog = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/coach-time-logs/${id}/approve`, {
        method: 'PUT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coach-time-logs'] });
      toast({
        title: "Success",
        description: "Time log approved successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve time log",
        variant: "destructive",
      });
    },
  });

  const deleteTimeLog = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/coach-time-logs/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coach-time-logs'] });
      toast({
        title: "Success",
        description: "Time log deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete time log",
        variant: "destructive",
      });
    },
  });

  // Filter time logs
  const filteredTimeLogs = timeLogs.filter((log) => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && !log.approved) ||
      (statusFilter === 'approved' && log.approved);
    
    const matchesCoach = coachFilter === 'all' || log.coachId.toString() === coachFilter;
    
    const coach = coaches.find(c => c.id === log.coachId);
    const matchesSearch = searchTerm === '' || 
      coach?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesCoach && matchesSearch;
  });

  const pendingCount = timeLogs.filter(log => !log.approved).length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading time logs...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Coach Time Logs
          </span>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {pendingCount} Pending
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Review and approve coach working hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coach-filter">Coach</Label>
            <Select value={coachFilter} onValueChange={setCoachFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Coaches</SelectItem>
                {coaches.map((coach) => (
                  <SelectItem key={coach.id} value={coach.id.toString()}>
                    {coach.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search notes or coach name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {/* Time Logs Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-4 py-3 text-left text-sm font-medium text-gray-900">Coach</th>
                <th className="border px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                <th className="border px-4 py-3 text-left text-sm font-medium text-gray-900">Hours</th>
                <th className="border px-4 py-3 text-left text-sm font-medium text-gray-900">Notes</th>
                <th className="border px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="border px-4 py-3 text-left text-sm font-medium text-gray-900">Submitted</th>
                <th className="border px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredTimeLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border px-4 py-8 text-center text-gray-500">
                    No time logs found
                  </td>
                </tr>
              ) : (
                filteredTimeLogs.map((log) => {
                  const coach = coaches.find(c => c.id === log.coachId);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="border px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium">{coach?.name || `Coach ID: ${log.coachId}`}</div>
                          {coach?.specialty && (
                            <div className="text-gray-500 text-xs">{coach.specialty}</div>
                          )}
                        </div>
                      </td>
                      <td className="border px-4 py-3 text-sm">
                        {format(new Date(log.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="border px-4 py-3 text-sm font-medium">
                        {parseFloat(log.hours).toFixed(2)}h
                      </td>
                      <td className="border px-4 py-3 text-sm">
                        <div className="max-w-xs truncate" title={log.notes || ''}>
                          {log.notes || '—'}
                        </div>
                      </td>
                      <td className="border px-4 py-3 text-sm">
                        <Badge 
                          variant={log.approved ? "default" : "secondary"}
                          className={log.approved ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                        >
                          {log.approved ? 'Approved' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="border px-4 py-3 text-sm text-gray-500">
                        {format(new Date(log.submittedAt), 'MMM dd, HH:mm')}
                      </td>
                      <td className="border px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          {!log.approved && (
                            <Button
                              size="sm"
                              onClick={() => approveTimeLog.mutate(log.id)}
                              disabled={approveTimeLog.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTimeLog.mutate(log.id)}
                            disabled={deleteTimeLog.isPending}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {filteredTimeLogs.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-900">Total Logs</div>
                <div className="text-gray-600">{filteredTimeLogs.length}</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Total Hours</div>
                <div className="text-gray-600">
                  {filteredTimeLogs.reduce((sum, log) => sum + parseFloat(log.hours), 0).toFixed(2)}h
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Approved</div>
                <div className="text-green-600">
                  {filteredTimeLogs.filter(log => log.approved).length}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Pending</div>
                <div className="text-orange-600">
                  {filteredTimeLogs.filter(log => !log.approved).length}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}