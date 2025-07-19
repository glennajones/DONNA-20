import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Square, History, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TimeClock() {
  const [clockedIn, setClockedIn] = useState(false);
  const [totalHours, setTotalHours] = useState(0);
  const [lastClockIn, setLastClockIn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allEntries, setAllEntries] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayEntries();
    fetchAllEntries();
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

  const fetchAllEntries = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      console.log("Fetching time history with token:", token ? "present" : "missing");
      
      const response = await fetch("/api/timeclock/history", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      
      console.log("History response status:", response.status);
      
      if (response.ok) {
        const entries = await response.json();
        console.log("Fetched entries:", entries);
        setAllEntries(entries);
      } else {
        const errorText = await response.text();
        console.error("History fetch failed:", response.status, errorText);
      }
    } catch (error) {
      console.error("Failed to fetch time history:", error);
    }
  };

  const calculateHours = (entries) => {
    let total = 0;
    let currentClockIn = null;
    let isClockedIn = false;
    
    // Sort entries by timestamp ascending to process them in order
    const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    sortedEntries.forEach(entry => {
      if (entry.action === "clock-in") {
        currentClockIn = new Date(entry.timestamp);
        setLastClockIn(currentClockIn.getTime());
        isClockedIn = true;
      } else if (entry.action === "clock-out" && currentClockIn) {
        const clockOut = new Date(entry.timestamp);
        total += (clockOut - currentClockIn) / 1000 / 60 / 60; // Convert to hours
        currentClockIn = null;
        isClockedIn = false;
        setLastClockIn(null);
      }
    });

    setClockedIn(isClockedIn);
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
        
        // Refresh both today's entries and full history
        fetchTodayEntries();
        fetchAllEntries();
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const calculateSessionDuration = (clockIn, clockOut) => {
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const groupEntriesByDate = (entries) => {
    const grouped = {};
    
    // Sort entries by timestamp ascending to pair them correctly
    const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    let i = 0;
    while (i < sortedEntries.length) {
      const entry = sortedEntries[i];
      
      if (entry.action === 'clock-in') {
        const date = formatDate(entry.timestamp);
        
        if (!grouped[date]) {
          grouped[date] = [];
        }
        
        // Look for the next clock-out entry
        let clockOut = null;
        if (i + 1 < sortedEntries.length && sortedEntries[i + 1].action === 'clock-out') {
          clockOut = sortedEntries[i + 1];
          i++; // Skip the clock-out entry in next iteration
        }
        
        grouped[date].push({
          clockIn: entry,
          clockOut: clockOut
        });
      }
      i++;
    }
    
    return grouped;
  };

  const groupedEntries = groupEntriesByDate(allEntries);

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Time Clock
            </div>
            <Button
              onClick={() => setShowHistory(!showHistory)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              {showHistory ? "Hide History" : "View History"}
            </Button>
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

      {showHistory && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Time Clock History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(groupedEntries).length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No time entries recorded yet.</p>
                <p className="text-sm">Your clock-in and clock-out history will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedEntries)
                  .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                  .map(([date, sessions]) => (
                    <div key={date} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        {date}
                      </h3>
                      
                      <div className="space-y-2">
                        {sessions.map((session, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <Play className="h-3 w-3 mr-1" />
                                  {formatTime(session.clockIn.timestamp)}
                                </Badge>
                                {session.clockOut ? (
                                  <Badge variant="outline" className="text-red-600 border-red-600">
                                    <Square className="h-3 w-3 mr-1" />
                                    {formatTime(session.clockOut.timestamp)}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                    In Progress
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              {session.clockOut ? (
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {calculateSessionDuration(session.clockIn.timestamp, session.clockOut.timestamp)}
                                </div>
                              ) : (
                                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                                  Currently Active
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}