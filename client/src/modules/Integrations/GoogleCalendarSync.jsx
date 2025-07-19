import React, { useState, useEffect } from 'react';

// 👉 Google OAuth client ID configured for testing
const GOOGLE_CLIENT_ID = "511078051910-im9pf7k89147s010lj118l1cgn7vk3k4.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

export default function GoogleCalendarSync() {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [error, setError] = useState('');
  const [accessToken, setAccessToken] = useState(null);

  // Load Google APIs and GIS scripts
  useEffect(() => {
    // Load GAPI script
    const gapiScript = document.createElement('script');
    gapiScript.src = "https://apis.google.com/js/api.js";
    gapiScript.onload = initGapi;
    document.body.appendChild(gapiScript);

    // Load GIS script
    const gisScript = document.createElement('script');
    gisScript.src = "https://accounts.google.com/gsi/client";
    gisScript.onload = initGis;
    document.body.appendChild(gisScript);
    
    // Check connection status on load
    checkConnectionStatus();
  }, []);

  const initGapi = async () => {
    await new Promise((resolve) => {
      window.gapi.load('client', resolve);
    });
    
    await window.gapi.client.init({
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    });
    
    setGapiLoaded(true);
  };

  const initGis = () => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse.error) {
          console.error('OAuth Error:', tokenResponse.error);
          setError(`Authentication failed: ${tokenResponse.error}`);
          return;
        }
        
        console.log('Token received:', tokenResponse);
        setAccessToken(tokenResponse.access_token);
        setIsSignedIn(true);
        
        // Save tokens to backend
        saveTokenToBackend(tokenResponse);
      },
      error_callback: (error) => {
        console.error('OAuth Error:', error);
        setError(`Authentication failed: ${error.type || 'Unknown error'}`);
      },
    });
    
    setTokenClient(client);
    setGisLoaded(true);
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

  const saveTokenToBackend = async (tokenResponse) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Please login first');
      return;
    }

    try {
      const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);
      
      await fetch("/api/integrations/calendar", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          access_token: tokenResponse.access_token,
          expires_at: expiresAt,
        }),
      });

      alert("Google Calendar connected successfully!");
      checkConnectionStatus();
    } catch (err) {
      console.error("Save token error:", err);
      setError("Failed to save authentication. Please try again.");
    }
  };

  const handleConnect = async () => {
    if (!tokenClient) {
      setError('Google authentication not ready. Please refresh the page.');
      return;
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Please login first');
      return;
    }

    try {
      setError('');
      tokenClient.requestAccessToken({ prompt: 'consent' });
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
      
      if (accessToken && window.google?.accounts?.oauth2) {
        window.google.accounts.oauth2.revoke(accessToken);
        setAccessToken(null);
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
      // Set access token for API calls
      window.gapi.client.setToken({access_token: accessToken});

      for (let evt of events) {
        try {
          await window.gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: {
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
            disabled={!gapiLoaded || !gisLoaded}
          >
            {(gapiLoaded && gisLoaded) ? 'Connect Google Calendar' : 'Loading...'}
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