import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Square, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function TimeClockWidget() {
  const [clockedIn, setClockedIn] = useState(false);
  const [totalHours, setTotalHours] = useState(0);
  const [lastClockIn, setLastClockIn] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayEntries();
  }, []);

  const fetchTodayEntries = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/timeclock/today", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const entries = await response.json();
        calculateHours(entries);
      }
    } catch (error) {
      console.error("Failed to fetch time entries:", error);
    }
  };

  const calculateHours = (entries) => {
    let total = 0;
    let currentClockIn = null;
    let isClockedIn = false;
    
    const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    sortedEntries.forEach(entry => {
      if (entry.action === "clock-in") {
        currentClockIn = new Date(entry.timestamp);
        setLastClockIn(currentClockIn.getTime());
        isClockedIn = true;
      } else if (entry.action === "clock-out" && currentClockIn) {
        const clockOut = new Date(entry.timestamp);
        const hours = (clockOut - currentClockIn) / (1000 * 60 * 60);
        total += hours;
        currentClockIn = null;
        isClockedIn = false;
      }
    });

    if (isClockedIn && currentClockIn) {
      const now = new Date();
      const currentHours = (now - currentClockIn) / (1000 * 60 * 60);
      total += currentHours;
    }

    setTotalHours(total);
    setClockedIn(isClockedIn);
  };

  const handleClockAction = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const action = clockedIn ? "clock-out" : "clock-in";
      
      const response = await fetch("/api/timeclock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        toast({
          title: clockedIn ? "Clocked Out" : "Clocked In",
          description: clockedIn ? "Your time has been recorded" : "Timer started successfully"
        });
        
        // Refresh the entries
        fetchTodayEntries();
      } else {
        throw new Error("Failed to record time");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record time entry",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hours) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" />
          Time Clock
        </CardTitle>
        <Link href="/coach-resources">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Status:
          </div>
          <Badge variant={clockedIn ? "default" : "secondary"} className="text-xs">
            {clockedIn ? "Clocked In" : "Clocked Out"}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Today's Hours:
          </div>
          <div className="font-semibold text-blue-600">
            {formatTime(totalHours)}
          </div>
        </div>

        {clockedIn && lastClockIn && (
          <div className="text-xs text-gray-500">
            Started: {new Date(lastClockIn).toLocaleTimeString()}
          </div>
        )}

        <Button 
          onClick={handleClockAction}
          disabled={loading}
          className={`w-full ${clockedIn ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          size="sm"
        >
          {loading ? (
            "Processing..."
          ) : (
            <>
              {clockedIn ? (
                <Square className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {clockedIn ? "Clock Out" : "Clock In"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}