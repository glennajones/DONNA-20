import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit2, Trash2, Save, X, User, Award, Clock, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18'];
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = ['08:00-12:00', '12:00-16:00', '16:00-20:00'];

interface Coach {
  id: number;
  name: string;
  email: string;
  phone?: string;
  specialties: string[];
  experienceYears: number;
  ageGroups: string[];
  skillLevels: string[];
  weeklyAvailability: Record<string, string[]>;
  certifications: string[];
  adminNotes?: string;
  location?: string;
  hourlyRate?: number;
  preferredChannel: 'email' | 'sms';
  status: 'active' | 'inactive' | 'unavailable';
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  experienceYears: number;
  ageGroups: string[];
  skillLevels: string[];
  weeklyAvailability: Record<string, string[]>;
  certifications: string[];
  adminNotes: string;
  location: string;
  hourlyRate: string;
  preferredChannel: 'email' | 'sms';
}

const initialFormData: FormData = {
  name: '',
  email: '',
  phone: '',
  specialties: [],
  experienceYears: 0,
  ageGroups: [],
  skillLevels: [],
  weeklyAvailability: {},
  certifications: [],
  adminNotes: '',
  location: '',
  hourlyRate: '',
  preferredChannel: 'email'
};

export default function EnhancedCoachManagement() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCertification, setNewCertification] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coaches = [], isLoading } = useQuery({
    queryKey: ['/api/coaches']
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest('POST', '/api/coaches', data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaches'] });
      resetForm();
      toast({ title: 'Success', description: 'Coach created successfully!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create coach', variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: FormData }) => 
      apiRequest('PUT', `/api/coaches/${id}`, data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaches'] });
      resetForm();
      toast({ title: 'Success', description: 'Coach updated successfully!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update coach', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/coaches/${id}`).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaches'] });
      toast({ title: 'Success', description: 'Coach deleted successfully!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete coach', variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
    setNewSpecialty('');
    setNewCertification('');
  };

  const handleEdit = (coach: Coach) => {
    setFormData({
      name: coach.name,
      email: coach.email,
      phone: coach.phone || '',
      specialties: coach.specialties || [],
      experienceYears: coach.experienceYears || 0,
      ageGroups: coach.ageGroups || [],
      skillLevels: coach.skillLevels || [],
      weeklyAvailability: coach.weeklyAvailability || {},
      certifications: coach.certifications || [],
      adminNotes: coach.adminNotes || '',
      location: coach.location || '',
      hourlyRate: coach.hourlyRate?.toString() || '',
      preferredChannel: coach.preferredChannel || 'email'
    });
    setEditingId(coach.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleArrayValue = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(prev[field]) 
        ? (prev[field] as string[]).includes(value)
          ? (prev[field] as string[]).filter(v => v !== value)
          : [...(prev[field] as string[]), value]
        : [value]
    }));
  };

  const updateAvailability = (day: string, slot: string) => {
    setFormData(prev => {
      const daySlots = prev.weeklyAvailability[day] || [];
      const updated = daySlots.includes(slot)
        ? daySlots.filter(s => s !== slot)
        : [...daySlots, slot];
      return {
        ...prev,
        weeklyAvailability: { ...prev.weeklyAvailability, [day]: updated }
      };
    });
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const removeCertification = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== cert)
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Coach Management</h1>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Coach</span>
        </Button>
      </div>

      <Tabs defaultValue="management" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="management">Coach Management</TabsTrigger>
          <TabsTrigger value="outreach">Outreach Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="management">{/* Main content will go here */}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingId ? 'Edit Coach' : 'Create New Coach'}</span>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="availability">Availability</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        step="0.01"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Preferred Contact</Label>
                      <div className="flex space-x-4 mt-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={formData.preferredChannel === 'email'}
                            onChange={() => setFormData(prev => ({ ...prev, preferredChannel: 'email' }))}
                          />
                          <span>Email</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={formData.preferredChannel === 'sms'}
                            onChange={() => setFormData(prev => ({ ...prev, preferredChannel: 'sms' }))}
                          />
                          <span>SMS</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="experience" className="space-y-6">
                  <div>
                    <Label htmlFor="experienceYears">Years of Experience</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      min="0"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  <div>
                    <Label>Specialties</Label>
                    <div className="flex space-x-2 mb-2">
                      <Input
                        placeholder="Add specialty"
                        value={newSpecialty}
                        onChange={(e) => setNewSpecialty(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                      />
                      <Button type="button" onClick={addSpecialty} size="sm">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.specialties.map(specialty => (
                        <Badge key={specialty} variant="secondary" className="flex items-center space-x-1">
                          <span>{specialty}</span>
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeSpecialty(specialty)} />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Certifications</Label>
                    <div className="flex space-x-2 mb-2">
                      <Input
                        placeholder="Add certification"
                        value={newCertification}
                        onChange={(e) => setNewCertification(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                      />
                      <Button type="button" onClick={addCertification} size="sm">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.certifications.map(cert => (
                        <Badge key={cert} variant="outline" className="flex items-center space-x-1">
                          <Award className="h-3 w-3" />
                          <span>{cert}</span>
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeCertification(cert)} />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Age Groups Comfortable Coaching</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {AGE_GROUPS.map(age => (
                        <label key={age} className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.ageGroups.includes(age)}
                            onCheckedChange={() => toggleArrayValue('ageGroups', age)}
                          />
                          <span>{age}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Skill Levels</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {SKILL_LEVELS.map(level => (
                        <label key={level} className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.skillLevels.includes(level)}
                            onCheckedChange={() => toggleArrayValue('skillLevels', level)}
                          />
                          <span className="capitalize">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="availability" className="space-y-4">
                  <Label>Weekly Availability</Label>
                  {WEEKDAYS.map(day => (
                    <div key={day} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">{day}</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_SLOTS.map(slot => (
                          <label key={slot} className="flex items-center space-x-2">
                            <Checkbox
                              checked={(formData.weeklyAvailability[day] || []).includes(slot)}
                              onCheckedChange={() => updateAvailability(day, slot)}
                            />
                            <span className="text-sm">{slot}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <div>
                    <Label htmlFor="adminNotes">Admin Notes</Label>
                    <Textarea
                      id="adminNotes"
                      rows={4}
                      value={formData.adminNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                      placeholder="Internal notes about this coach..."
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingId ? 'Update' : 'Create'} Coach</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Coaches List */}
      <Card>
        <CardHeader>
          <CardTitle>Coaches ({coaches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coaches.map((coach: Coach) => (
              <Card key={coach.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{coach.name}</span>
                      </h3>
                      <p className="text-sm text-gray-600">{coach.email}</p>
                      {coach.location && (
                        <p className="text-sm text-gray-500">{coach.location}</p>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(coach)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteMutation.mutate(coach.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3" />
                      <span className="text-sm">{coach.experienceYears} years experience</span>
                    </div>

                    {coach.ageGroups && coach.ageGroups.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Age Groups:</p>
                        <div className="flex flex-wrap gap-1">
                          {coach.ageGroups.map(age => (
                            <Badge key={age} variant="outline" className="text-xs">
                              {age}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {coach.skillLevels && coach.skillLevels.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Skill Levels:</p>
                        <div className="flex flex-wrap gap-1">
                          {coach.skillLevels.map(level => (
                            <Badge key={level} variant="secondary" className="text-xs capitalize">
                              {level}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {coach.specialties && coach.specialties.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Specialties:</p>
                        <div className="flex flex-wrap gap-1">
                          {coach.specialties.map(specialty => (
                            <Badge key={specialty} className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {coach.certifications && coach.certifications.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Certifications:</p>
                        <div className="flex flex-wrap gap-1">
                          {coach.certifications.map(cert => (
                            <Badge key={cert} variant="outline" className="text-xs flex items-center space-x-1">
                              <Award className="h-2 w-2" />
                              <span>{cert}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {coach.hourlyRate && (
                      <p className="text-sm text-green-600 font-medium">
                        ${coach.hourlyRate}/hour
                      </p>
                    )}

                    <Badge 
                      variant={coach.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {coach.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {coaches.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No coaches found. Create your first coach above!</p>
            </div>
          )}
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="outreach">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Coach Outreach Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Outreach System</h3>
              <p className="text-gray-600 mb-4">
                Track coach outreach status and responses for event assignments.
              </p>
              <p className="text-sm text-gray-500">
                This feature integrates with the existing event scheduling system to manage coach assignments and responses.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
}