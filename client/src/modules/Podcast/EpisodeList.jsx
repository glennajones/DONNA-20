import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Calendar, Clock } from "lucide-react";

export default function EpisodeList({ onSelectEpisode }) {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEpisodes() {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch("/api/podcast/episodes", {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error("Failed to fetch episodes");
        const data = await res.json();
        setEpisodes(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEpisodes();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading episodes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Volleyball Podcast</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Listen to coaching tips, player stories, and club updates</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {episodes.length} Episode{episodes.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {episodes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">🎙️</div>
              <h3 className="text-lg font-semibold mb-2">No episodes yet</h3>
              <p className="text-gray-500">Check back later for new podcast episodes!</p>
            </CardContent>
          </Card>
        ) : (
          episodes.map((episode) => (
            <Card 
              key={episode.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => onSelectEpisode(episode)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg mb-2">
                      <Play className="h-5 w-5 text-blue-600" />
                      {episode.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(episode.publishedAt || episode.createdAt).toLocaleDateString()}
                      </div>
                      {episode.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {episode.duration}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={episode.status === 'published' ? 'default' : 'secondary'}>
                    {episode.status || 'published'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                  {episode.description || episode.summary || 'No description available'}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}