import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Edit, Trash2, Plus, UserCheck, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ id: null, name: '', username: '', password: '', role: 'staff' });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/users', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddUser = async () => {
    if (!formData.name || !formData.username || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          password: formData.password,
          role: formData.role
        })
      });

      if (response.ok) {
        await fetchUsers();
        setFormData({ id: null, name: '', username: '', password: '', role: 'staff' });
        toast({
          title: "Success",
          description: "User created successfully."
        });
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (user) => {
    setFormData({ ...user, password: '' });
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.username) {
      toast({
        title: "Validation Error",
        description: "Name and username are required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const updateData = {
        name: formData.name,
        username: formData.username,
        role: formData.role
      };
      
      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/users/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchUsers();
        setFormData({ id: null, name: '', username: '', password: '', role: 'staff' });
        setIsEditing(false);
        toast({
          title: "Success",
          description: "User updated successfully."
        });
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        await fetchUsers();
        toast({
          title: "Success",
          description: "User deleted successfully."
        });
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'coach': return 'secondary';
      case 'staff': return 'secondary';
      default: return 'outline';
    }
  };

  const handleCancel = () => {
    setFormData({ id: null, name: '', username: '', password: '', role: 'staff' });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-60 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>

      {/* Add/Edit User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isEditing ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {isEditing ? 'Edit User' : 'Add New User'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label htmlFor="password">Password {isEditing ? '(leave blank to keep current)' : '*'}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={isEditing ? "Enter new password" : "Enter password"}
              />
            </div>
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleUpdate} className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Update User
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={handleAddUser} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(user)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="flex items-center gap-1">
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}