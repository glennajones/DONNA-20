import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import TVCalendarDisplay from "@/components/scheduling/TVCalendarDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Settings, ArrowLeft, Calendar, Zap, RefreshCw } from "lucide-react";

export default function TVDisplayPage() {
  const [isConfigMode, setIsConfigMode] = useState(true);
  const [config, setConfig] = useState({
    autoRefresh: true,
    refreshInterval: 30,
    date: new Date(),
    showCurrentTime: true,
    fullScreen: false
  });
  const [, setLocation] = useLocation();

  // URL parameters for direct TV mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tvMode = urlParams.get('tv');
    const refresh = urlParams.get('refresh');
    const date = urlParams.get('date');
    
    if (tvMode === 'true') {
      setIsConfigMode(false);
      if (refresh) {
        setConfig(prev => ({ ...prev, refreshInterval: parseInt(refresh) || 30 }));
      }
      if (date) {
        setConfig(prev => ({ ...prev, date: new Date(date) }));
      }
    }
  }, []);

  const startTVMode = () => {
    setIsConfigMode(false);
    if (config.fullScreen) {
      document.documentElement.requestFullscreen?.();
    }
  };

  const exitTVMode = () => {
    setIsConfigMode(true);
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  };

  // Generate shareable TV URL
  const getTVUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      tv: 'true',
      refresh: config.refreshInterval.toString(),
      date: config.date.toISOString().split('T')[0]
    });
    return `${baseUrl}?${params.toString()}`;
  };

  if (!isConfigMode) {
    return (
      <div className="relative">
        <TVCalendarDisplay 
          date={config.date}
          autoRefresh={config.autoRefresh}
          refreshInterval={config.refreshInterval}
        />
        
        {/* Hidden exit button - appears on hover */}
        <div className="fixed top-4 left-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <Button 
            onClick={exitTVMode}
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit TV Mode
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">TV Display Setup</h1>
          </div>
          <Button 
            onClick={() => setLocation('/training-scheduling')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Schedule
          </Button>
        </div>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              External TV Display
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Create a large, auto-refreshing calendar display perfect for external TVs, lobby screens, 
              or any public display. The TV mode features large fonts, high contrast colors, and 
              automatic updates to keep everyone informed of the daily schedule.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <Zap className="h-4 w-4" />
                Auto-refreshing every 30 seconds
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <Monitor className="h-4 w-4" />
                Large, TV-optimized text
              </div>
              <div className="flex items-center gap-2 text-purple-600">
                <RefreshCw className="h-4 w-4" />
                Real-time current event tracking
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Display Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Display Date</label>
                <input
                  type="date"
                  value={config.date.toISOString().split('T')[0]}
                  onChange={(e) => setConfig(prev => ({ ...prev, date: new Date(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Refresh Interval */}
              <div>
                <label className="block text-sm font-medium mb-2">Auto-refresh interval (seconds)</label>
                <select
                  value={config.refreshInterval}
                  onChange={(e) => setConfig(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                </select>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={config.autoRefresh}
                  onChange={(e) => setConfig(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="autoRefresh" className="text-sm font-medium">
                  Enable auto-refresh
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="fullScreen"
                  checked={config.fullScreen}
                  onChange={(e) => setConfig(prev => ({ ...prev, fullScreen: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="fullScreen" className="text-sm font-medium">
                  Start in full-screen mode
                </label>
              </div>
            </div>

            {/* Shareable URL */}
            <div>
              <label className="block text-sm font-medium mb-2">Shareable TV URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={getTVUrl()}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <Button
                  onClick={() => navigator.clipboard.writeText(getTVUrl())}
                  variant="outline"
                  size="sm"
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use this URL to open the TV display directly on any device or browser.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Start TV Mode */}
        <div className="flex justify-center">
          <Button 
            onClick={startTVMode}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            <Monitor className="h-5 w-5 mr-2" />
            Start TV Display Mode
          </Button>
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-4 border-gray-300 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <div className="bg-gray-900 text-white p-4 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">VolleyClub Pro</div>
                  <div className="text-lg text-gray-300">TV Display Preview</div>
                  <div className="text-sm text-gray-400 mt-2">
                    Date: {config.date.toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-400">
                    Refresh: Every {config.refreshInterval}s
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}