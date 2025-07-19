import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function GameTools() {
  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Game Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Game Statistics Coming Soon</p>
          <p className="text-sm">Advanced game tracking and statistics will be available in a future update.</p>
        </div>
      </CardContent>
    </Card>
  );
}