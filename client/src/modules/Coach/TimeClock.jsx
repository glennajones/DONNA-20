import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Play, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TimeClock() {
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
    
    entries.forEach(entry => {
      if (entry.action === "clock-in") {
        currentClockIn = new Date(entry.timestamp);
        setLastClockIn(currentClockIn.getTime());
        setClockedIn(true);
      } else if (entry.action === "clock-out" && currentClockIn) {
        const clockOut = new Date(entry.timestamp);
        total += (clockOut - currentClockIn) / 1000 / 60 / 60; // Convert to hours
        currentClockIn = null;
        setClockedIn(false);
        setLastClockIn(null);
      }
    });

    setTotalHours(total);
  };

  const handleClock = async (action) => {
    setLoading(true);
    const timestamp = new Date().toISOString();
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/timeclock", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action, timestamp }),
      });

      if (response.ok) {
        if (action === "clock-in") {
          setClockedIn(true);
          setLastClockIn(Date.now());
          toast({
            title: "Clocked In",
            description: "Your work time is now being tracked."
          });
        } else {
          setClockedIn(false);
          if (lastClockIn) {
            const diff = (Date.now() - lastClockIn) / 1000 / 60 / 60; // in hours
            setTotalHours((prev) => prev + diff);
          }
          setLastClockIn(null);
          toast({
            title: "Clocked Out",
            description: "Your work session has been recorded."
          });
        }
      } else {
        throw new Error("Failed to record time");
      }
    } catch (error) {
      console.error("Clock action failed:", error);
      toast({
        title: "Error",
        description: "Failed to record time. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Time Clock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {totalHours.toFixed(2)} hrs
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours Today</p>
        </div>
        
        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => handleClock("clock-in")}
            disabled={clockedIn || loading}
            className="flex items-center gap-2"
            variant={clockedIn ? "secondary" : "default"}
          >
            <Play className="h-4 w-4" />
            Clock In
          </Button>
          
          <Button
            onClick={() => handleClock("clock-out")}
            disabled={!clockedIn || loading}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Clock Out
          </Button>
        </div>
        
        {clockedIn && (
          <div className="text-center text-sm text-green-600 dark:text-green-400">
            ● Currently clocked in
          </div>
        )}
      </CardContent>
    </Card>
  );
}