import React, { useState } from "react";
import EpisodeList from "../modules/Podcast/EpisodeList";
import EpisodePlayer from "../modules/Podcast/EpisodePlayer";

export default function PodcastPage() {
  const [selectedEpisode, setSelectedEpisode] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {!selectedEpisode ? (
          <EpisodeList onSelectEpisode={setSelectedEpisode} />
        ) : (
          <EpisodePlayer 
            episode={selectedEpisode} 
            onBack={() => setSelectedEpisode(null)} 
          />
        )}
      </div>
    </div>
  );
}