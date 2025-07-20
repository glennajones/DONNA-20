import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function PracticeLibrary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          Practice Library
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Practice plans and training resources will be available here.</p>
      </CardContent>
    </Card>
  );
}