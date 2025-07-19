import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertParentSchema, type Parent, type InsertParent, type Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, UserPlus } from "lucide-react";

interface ParentFormProps {
  parent?: Parent;
  onSaved: () => void;
  onCancel: () => void;
}

export function ParentForm({ parent, onSaved, onCancel }: ParentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players = [] } = useQuery({
    queryKey: ["/api/players"],
  });

  const form = useForm<InsertParent>({
    resolver: zodResolver(insertParentSchema),
    defaultValues: {
      name: parent?.name || "",
      email: parent?.email || "",
      phone: parent?.phone || "",
      communicationPreference: parent?.communicationPreference || "Email",
      children: parent?.children || [],
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: InsertParent) => {
      const url = parent ? `/api/parents/${parent.id}` : "/api/parents";
      const method = parent ? "PUT" : "POST";
      return apiRequest(url, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parents"] });
      toast({
        title: "Success",
        description: parent ? "Parent updated successfully" : "Parent created successfully",
      });
      onSaved();
    },
    onError: () => {
      toast({
        title: "Error",
        description: parent ? "Failed to update parent" : "Failed to create parent",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertParent) => {
    saveMutation.mutate(data);
  };

  const communicationOptions = ["Email", "SMS", "GroupMe"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#56A0D3]" />
              {parent ? "Edit Parent" : "Add Parent"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="parent@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="communicationPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Communication Preference</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select preference" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {communicationOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="children"
                render={() => (
                  <FormItem>
                    <FormLabel>Children</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                      {players.length === 0 ? (
                        <div className="col-span-full text-center text-gray-500 py-4">
                          No players available. Add players first to link them to parents.
                        </div>
                      ) : (
                        players.map((player: Player) => (
                          <FormField
                            key={player.id}
                            control={form.control}
                            name="children"
                            render={({ field }) => {
                              return (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(player.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, player.id])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== player.id)
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {player.name}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 justify-end pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={saveMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saveMutation.isPending}
                  className="bg-[#56A0D3] hover:bg-[#4A8BC2]"
                >
                  {saveMutation.isPending ? "Saving..." : (parent ? "Save Changes" : "Add Parent")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}