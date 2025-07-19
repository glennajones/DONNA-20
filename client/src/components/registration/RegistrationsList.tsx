import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { type Registration } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  MoreHorizontal, 
  Check, 
  X, 
  Clock, 
  Mail, 
  Phone,
  Calendar,
  User,
  AlertTriangle
} from "lucide-react";

export default function RegistrationsList() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading, error } = useQuery({
    queryKey: ["/api/registrations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/registrations");
      return await response.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Registration["status"] }) => {
      const response = await apiRequest("PATCH", `/api/registrations/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      toast({
        title: "Status updated",
        description: "Registration status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update registration status.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: Registration["status"]) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "pending":
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getPlayerTypeBadge = (playerType: Registration["playerType"]) => {
    return playerType === "player" 
      ? <Badge variant="outline" className="bg-blue-50 text-blue-700">Player</Badge>
      : <Badge variant="outline" className="bg-purple-50 text-purple-700">Parent/Guardian</Badge>;
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStatusUpdate = (id: number, status: Registration["status"]) => {
    updateStatusMutation.mutate({ id, status });
  };

  if (!hasRole(["admin", "manager"])) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to view registrations.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load registrations. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const pendingCount = registrations.filter((r: Registration) => r.status === "pending").length;
  const approvedCount = registrations.filter((r: Registration) => r.status === "approved").length;
  const rejectedCount = registrations.filter((r: Registration) => r.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Applications</CardTitle>
          <CardDescription>
            Manage and review volleyball club registration applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading registrations...</span>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations</h3>
              <p className="mt-1 text-sm text-gray-500">
                No registration applications have been submitted yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Registration Fee</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((registration: Registration) => (
                    <TableRow key={registration.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {registration.name}
                            </div>
                            {registration.emergencyContact && (
                              <div className="text-sm text-gray-500">
                                Emergency: {registration.emergencyContact}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="h-3 w-3 mr-1" />
                            {registration.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="h-3 w-3 mr-1" />
                            {registration.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPlayerTypeBadge(registration.playerType)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                          {calculateAge(registration.dateOfBirth)} years
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          ${parseFloat(registration.registrationFee).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {formatDate(registration.createdAt!)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(registration.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {registration.status !== "approved" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(registration.id, "approved")}
                                disabled={updateStatusMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {registration.status !== "rejected" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(registration.id, "rejected")}
                                disabled={updateStatusMutation.isPending}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            )}
                            {registration.status !== "pending" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(registration.id, "pending")}
                                disabled={updateStatusMutation.isPending}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Mark as Pending
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}