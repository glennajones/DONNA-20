import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Users } from "lucide-react";
import EvaluationForm from "../modules/Performance/EvaluationForm.jsx";
import Scoreboard from "../modules/Performance/Scoreboard.jsx";

export default function Performance() {
  const [activeTab, setActiveTab] = useState("evaluations");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Trophy className="h-8 w-8 text-blue-600 mr-3" />
                Performance Tracking
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Evaluate player performance and manage team formations
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Evaluations
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Coming Soon
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Players Evaluated
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Coming Soon
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Teams Formed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Coming Soon
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="evaluations">Player Evaluations</TabsTrigger>
                <TabsTrigger value="scoreboard">Scoreboard & Teams</TabsTrigger>
              </TabsList>
              
              <TabsContent value="evaluations" className="mt-6">
                <EvaluationForm />
              </TabsContent>
              
              <TabsContent value="scoreboard" className="mt-6">
                <Scoreboard />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}