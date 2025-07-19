import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gamepad, Users, BarChart3, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GameTools() {
  const initialPlayers = ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6"];
  const [lineup, setLineup] = useState(initialPlayers);
  const [gameId, setGameId] = useState("");
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize stats for each player
    const initialStats = {};
    lineup.forEach(player => {
      initialStats[player] = { points: 0, assists: 0, rebounds: 0 };
    });
    setStats(initialStats);
  }, [lineup]);

  const handleDragStart = (e, idx) => {
    e.dataTransfer.setData("playerIndex", idx);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("playerIndex"));
    if (dragIndex === dropIndex) return;
    
    const updated = [...lineup];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, moved);
    setLineup(updated);
  };

  const allowDrop = (e) => e.preventDefault();

  const handleStatChange = (player, statType, value) => {
    setStats(prev => ({
      ...prev,
      [player]: {
        ...prev[player],
        [statType]: parseInt(value) || 0
      }
    }));
  };

  const saveLineup = async () => {
    if (!gameId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a game ID to save the lineup.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/game-lineups", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          name: `Game ${gameId} Lineup`, 
          players: lineup 
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Lineup saved successfully."
        });
      }
    } catch (error) {
      console.error("Failed to save lineup:", error);
      toast({
        title: "Error",
        description: "Failed to save lineup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveStats = async () => {
    if (!gameId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a game ID to save stats.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      // Save stats for each player
      for (const player of lineup) {
        await fetch("/api/game-stats", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ 
            gameId, 
            playerName: player,
            points: stats[player]?.points || 0,
            assists: stats[player]?.assists || 0,
            rebounds: stats[player]?.rebounds || 0
          }),
        });
      }

      toast({
        title: "Success",
        description: "Game stats saved successfully."
      });
    } catch (error) {
      console.error("Failed to save stats:", error);
      toast({
        title: "Error",
        description: "Failed to save stats. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = () => {
    const newPlayerName = `Player ${lineup.length + 1}`;
    setLineup([...lineup, newPlayerName]);
  };

  const removePlayer = (index) => {
    if (lineup.length > 1) {
      const playerToRemove = lineup[index];
      setLineup(lineup.filter((_, i) => i !== index));
      
      // Remove stats for removed player
      const newStats = { ...stats };
      delete newStats[playerToRemove];
      setStats(newStats);
    }
  };

  return (
    <div className="space-y-6">
      {/* Game ID Input */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad className="h-5 w-5 text-blue-600" />
            Game Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Game ID (e.g., vs Team A, Tournament Final)"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addPlayer} variant="outline">
              Add Player
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lineup Cards */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Lineup (Drag to Reorder)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {lineup.map((player, i) => (
              <div
                key={i}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDrop={(e) => handleDrop(e, i)}
                onDragOver={allowDrop}
                className="group relative p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg cursor-move hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <div className="text-center">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Position {i + 1}
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {player}
                  </div>
                </div>
                {lineup.length > 1 && (
                  <button
                    onClick={() => removePlayer(i)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button onClick={saveLineup} disabled={loading} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Lineup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Sheet */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Game Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">
                    Player
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">
                    Points
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">
                    Assists
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">
                    Rebounds
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineup.map((player, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="p-3 font-medium text-gray-900 dark:text-white">
                      {player}
                    </td>
                    <td className="p-3 text-center">
                      <Input
                        type="number"
                        min="0"
                        value={stats[player]?.points || 0}
                        onChange={(e) => handleStatChange(player, 'points', e.target.value)}
                        className="w-20 mx-auto text-center"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Input
                        type="number"
                        min="0"
                        value={stats[player]?.assists || 0}
                        onChange={(e) => handleStatChange(player, 'assists', e.target.value)}
                        className="w-20 mx-auto text-center"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Input
                        type="number"
                        min="0"
                        value={stats[player]?.rebounds || 0}
                        onChange={(e) => handleStatChange(player, 'rebounds', e.target.value)}
                        className="w-20 mx-auto text-center"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Button onClick={saveStats} disabled={loading} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Game Stats
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}