import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Users } from "lucide-react";
import { CampaignsList } from "@/components/fundraising/CampaignsList";
import { SponsorsList } from "@/components/fundraising/SponsorsList";
import { DashboardNav } from "@/components/ui/dashboard-nav";

export function FundraisingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#56A0D3]">
              Fundraising & Sponsorship
            </h1>
            <p className="text-gray-600">
              Manage campaigns and sponsor relationships
            </p>
          </div>
          <DashboardNav />
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="sponsors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Sponsors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-[#56A0D3]" />
                  Fundraising Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CampaignsList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sponsors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#56A0D3]" />
                  Sponsor Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SponsorsList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}