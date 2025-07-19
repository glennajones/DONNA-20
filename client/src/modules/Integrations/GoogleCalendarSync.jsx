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
      
      // If we have a valid connection, set the signed in state
      if (status.connected && !status.expired) {
        setIsSignedIn(true);
        // We don't have the actual access token from storage, but we're connected
        setAccessToken('connected'); // Placeholder to indicate connection
      }
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
    // Check if we have a stored connection instead of requiring fresh sign-in
    if (!connectionStatus?.connected) {
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

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      setError('Import timed out. Please try again.');
      setSyncing(false);
    }, 30000); // 30 second timeout

    try {
      // Get a fresh token for API calls since we need the actual access token
      if (!tokenClient) {
        clearTimeout(timeoutId);
        setError('Google authentication not ready. Please refresh the page and reconnect.');
        setSyncing(false);
        return;
      }

      // Request a new access token for this operation
      tokenClient.requestAccessToken({ 
        prompt: '',
        callback: async (tokenResponse) => {
          try {
            if (tokenResponse.error) {
              console.error('Token error:', tokenResponse.error);
              clearTimeout(timeoutId);
              setError(`Authentication failed: ${tokenResponse.error}`);
              setSyncing(false);
              return;
            }
            
            console.log('Fresh token received for import:', tokenResponse.access_token ? 'Yes' : 'No');
            // Set access token for API calls
            window.gapi.client.setToken({access_token: tokenResponse.access_token});

            // Get upcoming events from Google Calendar
            const timeMin = new Date().toISOString();
            const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now
            
            console.log('Fetching events from Google Calendar...');
            const response = await window.gapi.client.calendar.events.list({
              calendarId: 'primary',
              timeMin: timeMin,
              timeMax: timeMax,
              maxResults: 50,
              singleEvents: true,
              orderBy: 'startTime'
            });

            console.log('Google Calendar API response:', response);
            const googleEvents = response.result.items || [];
            console.log(`Found ${googleEvents.length} events in Google Calendar`);
            
            if (googleEvents.length === 0) {
              alert('No upcoming events found in your Google Calendar');
              setSyncing(false);
              return;
            }

            // Import Google Calendar events to club system
            let importedCount = 0;
            console.log(`Starting import of ${googleEvents.length} events from Google Calendar...`);
            
            for (let i = 0; i < googleEvents.length; i++) {
              const googleEvent = googleEvents[i];
              try {
                console.log(`Importing event ${i + 1}/${googleEvents.length}: ${googleEvent.summary}`);
                
                const eventData = {
                  title: googleEvent.summary || 'Untitled Event',
                  date: googleEvent.start.date || googleEvent.start.dateTime?.split('T')[0],
                  startTime: googleEvent.start.dateTime ? 
                    new Date(googleEvent.start.dateTime).toTimeString().slice(0, 5) : '09:00',
                  endTime: googleEvent.end.dateTime ? 
                    new Date(googleEvent.end.dateTime).toTimeString().slice(0, 5) : '10:00',
                  court: 'Court 1', // Default court assignment
                  eventType: 'imported',
                  notes: googleEvent.description || 'Imported from Google Calendar',
                  coach: 'TBD'
                };

                const response = await fetch("/api/schedule", {
                  method: "POST",
                  headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                  },
                  body: JSON.stringify(eventData)
                });

                if (response.ok) {
                  importedCount++;
                  console.log(`✓ Successfully imported: ${googleEvent.summary}`);
                } else {
                  const errorText = await response.text();
                  console.error(`Failed to import ${googleEvent.summary}:`, response.status, errorText);
                }
              } catch (eventErr) {
                console.error(`Failed to import event: ${googleEvent.summary}`, eventErr);
              }
            }

            clearTimeout(timeoutId);
            alert(`✅ Imported ${importedCount} of ${googleEvents.length} events from Google Calendar to club schedule`);
            setSyncing(false);
          } catch (err) {
            console.error("Sync error:", err);
            clearTimeout(timeoutId);
            setError("Failed to import events from Google Calendar. Please check your connection and try again.");
            setSyncing(false);
          }
        },
        error_callback: (error) => {
          console.error('Token request error:', error);
          clearTimeout(timeoutId);
          setError(`Authentication failed: ${error.type || 'Unknown error'}`);
          setSyncing(false);
        }
      });

    } catch (err) {
      console.error("Sync error:", err);
      clearTimeout(timeoutId);
      setError("Failed to import events from Google Calendar. Please check your connection and try again.");
      setSyncing(false);
    }
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
              {syncing ? 'Importing Events...' : 'Import Events from Google Calendar'}
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
        <p>This integration imports upcoming events from your Google Calendar into the club's scheduling system.</p>
        <p className="mt-1">Events from the next 30 days will be imported and assigned to Court 1 by default.</p>
      </div>
    </div>
  );
}