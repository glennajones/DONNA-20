import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Star, Building2, Phone, Globe, Mail } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Sponsor, InsertSponsor } from "@shared/schema";

export function SponsorsList() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [formData, setFormData] = useState<InsertSponsor>({
    name: "",
    logo: "",
    tier: "Bronze",
    contact: "",
    phone: "",
    website: "",
    notes: "",
    active: true
  });

  const { data: sponsors, isLoading } = useQuery({
    queryKey: ["/api/sponsors"],
    queryFn: async () => {
      const response = await apiRequest("/api/sponsors");
      const data = await response.json();
      return data as Sponsor[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (sponsorData: InsertSponsor) => {
      const response = await apiRequest("/api/sponsors", {
        method: "POST",
        body: JSON.stringify(sponsorData)
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      setIsModalOpen(false);
      resetForm();
      toast({
        title: "Success!",
        description: "Sponsor has been created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sponsor",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSponsor> }) => {
      const response = await apiRequest(`/api/sponsors/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      setIsModalOpen(false);
      resetForm();
      toast({
        title: "Success!",
        description: "Sponsor has been updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update sponsor",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/sponsors/${id}`, {
        method: "DELETE"
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      toast({
        title: "Success!",
        description: "Sponsor has been deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete sponsor",
        variant: "destructive"
      });
    }
  });

  const openModal = (sponsor?: Sponsor) => {
    if (sponsor) {
      setEditingSponsor(sponsor);
      setFormData({
        name: sponsor.name,
        logo: sponsor.logo || "",
        tier: sponsor.tier,
        contact: sponsor.contact || "",
        phone: sponsor.phone || "",
        website: sponsor.website || "",
        notes: sponsor.notes || "",
        active: sponsor.active
      });
    } else {
      setEditingSponsor(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      logo: "",
      tier: "Bronze",
      contact: "",
      phone: "",
      website: "",
      notes: "",
      active: true
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSponsor) {
      updateMutation.mutate({ id: editingSponsor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Diamond': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Platinum': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Silver': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Bronze': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTierIcon = (tier: string) => {
    const count = {
      'Diamond': 5,
      'Platinum': 4,
      'Gold': 3,
      'Silver': 2,
      'Bronze': 1
    }[tier] || 1;

    return (
      <div className="flex">
        {Array.from({ length: count }, (_, i) => (
          <Star key={i} className="h-3 w-3 fill-current" />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <div>Loading sponsors...</div>;
  }

  const sponsorsList = Array.isArray(sponsors) ? sponsors : [];
  const activeSponsors = sponsorsList.filter(sponsor => sponsor.active);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Sponsors</h3>
          <p className="text-sm text-gray-600">Manage sponsor relationships and partnerships</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openModal()} className="bg-[#56A0D3] hover:bg-[#4A90C2]">
              <Plus className="h-4 w-4 mr-2" />
              Add Sponsor
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSponsor ? "Edit Sponsor" : "Add Sponsor"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Sponsor Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tier">Sponsorship Tier</Label>
                  <Select
                    value={formData.tier}
                    onValueChange={(value: any) => setFormData({ ...formData, tier: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bronze">Bronze</SelectItem>
                      <SelectItem value="Silver">Silver</SelectItem>
                      <SelectItem value="Gold">Gold</SelectItem>
                      <SelectItem value="Platinum">Platinum</SelectItem>
                      <SelectItem value="Diamond">Diamond</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                {formData.logo && (
                  <div className="mt-2">
                    <img 
                      src={formData.logo} 
                      alt="Preview" 
                      className="h-16 w-16 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Email</Label>
                  <Input
                    id="contact"
                    type="email"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional notes about this sponsor..."
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="active">Active Sponsor</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#56A0D3] hover:bg-[#4A90C2]"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingSponsor ? "Update" : "Create"} Sponsor
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {activeSponsors.length === 0 ? (
        <div className="text-center py-8">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No sponsors found. Add your first sponsor!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeSponsors.map((sponsor) => (
            <Card key={sponsor.id} className="relative">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    {sponsor.logo && (
                      <img
                        src={sponsor.logo}
                        alt={sponsor.name}
                        className="h-12 w-12 object-cover rounded border"
                      />
                    )}
                    <div>
                      <h4 className="font-semibold text-lg">{sponsor.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        {getTierIcon(sponsor.tier)}
                        <Badge className={getTierColor(sponsor.tier)}>
                          {sponsor.tier}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModal(sponsor)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(sponsor.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  {sponsor.contact && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{sponsor.contact}</span>
                    </div>
                  )}
                  {sponsor.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>{sponsor.phone}</span>
                    </div>
                  )}
                  {sponsor.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <a
                        href={sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#56A0D3] hover:underline"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>
                
                {sponsor.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">
                      {sponsor.notes.length > 80
                        ? `${sponsor.notes.substring(0, 80)}...`
                        : sponsor.notes
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}