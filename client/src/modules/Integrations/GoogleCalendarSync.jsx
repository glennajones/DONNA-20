import React, { useState, useEffect } from 'react';

// 👉 For testing - replace with your Google OAuth client ID when ready
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

export default function GoogleCalendarSync() {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authInstance, setAuthInstance] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [error, setError] = useState('');

  // Load GAPI script
  useEffect(() => {
    // Check if we have a valid Google Client ID
    if (GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com") {
      setError('Google Client ID not configured. Please set up OAuth credentials first.');
      return;
    }

    const script = document.createElement('script');
    script.src = "https://apis.google.com/js/api.js";
    script.onload = initClient;
    document.body.appendChild(script);
    
    // Check connection status on load
    checkConnectionStatus();
  }, []);

  const initClient = () => {
    window.gapi.load('client:auth2', async () => {
      try {
        await window.gapi.client.init({
          clientId: GOOGLE_CLIENT_ID,
          scope: SCOPES,
        });
        const auth = window.gapi.auth2.getAuthInstance();
        setAuthInstance(auth);
        setIsSignedIn(auth.isSignedIn.get());
        auth.isSignedIn.listen(setIsSignedIn);
        setGapiLoaded(true);
      } catch (err) {
        console.error('GAPI initialization error:', err);
        setError('Failed to initialize Google API. Please check your configuration.');
      }
    });
  };

  const checkConnectionStatus = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const res = await fetch("/api/integrations/calendar/status", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const status = await res.json();
      setConnectionStatus(status);
    } catch (err) {
      console.error("Failed to check connection status", err);
    }
  };

  const handleConnect = async () => {
    if (!authInstance) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Please login first');
      return;
    }

    try {
      setError('');
      const user = await authInstance.signIn();
      const authResponse = user.getAuthResponse(true);
      console.log("Google OAuth Success:", authResponse);

      // ✅ Save tokens to backend
      await fetch("/api/integrations/calendar", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          access_token: authResponse.access_token,
          id_token: authResponse.id_token,
          expires_at: authResponse.expires_at,
          refresh_token: authResponse.refresh_token,
        }),
      });

      alert("Google Calendar connected successfully!");
      checkConnectionStatus();
    } catch (err) {
      console.error("OAuth Error:", err);
      setError("Failed to connect Google Calendar. Please try again.");
    }
  };

  const handleDisconnect = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      await fetch("/api/integrations/calendar", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (authInstance) {
        authInstance.signOut();
      }
      
      setConnectionStatus(null);
      alert("Google Calendar disconnected successfully!");
    } catch (err) {
      console.error("Disconnect error:", err);
      setError("Failed to disconnect Google Calendar.");
    }
  };

  const handleSyncEvents = async () => {
    if (!isSignedIn) {
      setError('Please connect to Google Calendar first');
      return;
    }

    setSyncing(true);
    setError('');
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Please login first');
      setSyncing(false);
      return;
    }

    try {
      // 👉 Fetch upcoming club events from backend
      const eventsRes = await fetch("/api/events/upcoming", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const events = await eventsRes.json();

      if (events.length === 0) {
        alert('No upcoming events found to sync');
        setSyncing(false);
        return;
      }

      let syncedCount = 0;
      for (let evt of events) {
        try {
          await window.gapi.client.request({
            path: '/calendar/v3/calendars/primary/events',
            method: 'POST',
            body: {
              summary: evt.title,
              description: evt.description,
              start: { dateTime: evt.start, timeZone: 'UTC' },
              end: { dateTime: evt.end, timeZone: 'UTC' },
              location: evt.location,
            },
          });
          syncedCount++;
        } catch (eventErr) {
          console.error(`Failed to sync event: ${evt.title}`, eventErr);
        }
      }

      alert(`✅ Synced ${syncedCount} of ${events.length} events to Google Calendar`);
    } catch (err) {
      console.error("Sync error:", err);
      setError("Failed to sync events. Please check your connection and try again.");
    }
    setSyncing(false);
  };

  // Show configuration message if Google Client ID is not set up
  if (GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com") {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded shadow-md max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-yellow-800">Google Calendar Integration</h1>
        <div className="text-yellow-700">
          <p className="mb-2">⚠️ Configuration Required</p>
          <p className="text-sm">
            To enable Google Calendar integration, you need to:
          </p>
          <ol className="text-sm mt-2 ml-4 list-decimal">
            <li>Set up Google OAuth credentials in Google Cloud Console</li>
            <li>Replace the GOOGLE_CLIENT_ID in the component with your actual client ID</li>
            <li>Configure authorized redirect URIs</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded shadow-md max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Google Calendar Integration</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {connectionStatus && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className={`font-medium ${connectionStatus.connected ? 'text-green-600' : 'text-yellow-600'}`}>
            {connectionStatus.connected ? '✅ Connected to Google Calendar' : '⚠️ Connection Expired'}
          </p>
          {connectionStatus.expiresAt && (
            <p className="text-sm text-gray-600 mt-1">
              Expires: {new Date(connectionStatus.expiresAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {!connectionStatus?.connected ? (
          <button
            onClick={handleConnect}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium"
            disabled={!gapiLoaded}
          >
            {gapiLoaded ? 'Connect Google Calendar' : 'Loading...'}
          </button>
        ) : (
          <>
            <button
              onClick={handleSyncEvents}
              className={`w-full ${
                syncing ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
              } text-white px-4 py-2 rounded font-medium`}
              disabled={syncing}
            >
              {syncing ? 'Syncing Events...' : 'Sync Upcoming Events'}
            </button>
            
            <button
              onClick={handleDisconnect}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium"
            >
              Disconnect Google Calendar
            </button>
          </>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>This integration syncs upcoming club events to your Google Calendar.</p>
        <p className="mt-1">Events from the next 30 days will be synchronized.</p>
      </div>
    </div>
  );
}