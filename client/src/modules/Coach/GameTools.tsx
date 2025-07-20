import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

export default function GameTools() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Game Tools
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Game management and analysis tools will be available here.</p>
      </CardContent>
    </Card>
  );
}