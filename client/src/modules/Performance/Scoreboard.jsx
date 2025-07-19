import React, { useEffect, useState } from "react";

export default function Scoreboard() {
  const [data, setData] = useState([]);
  const [teams, setTeams] = useState(null);

  const fetchScores = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const res = await fetch("/api/evaluations", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch scores", err);
    }
  };

  const autoFormTeams = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Please login first');
      return;
    }

    try {
      const res = await fetch("/api/teams/auto", { 
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const json = await res.json();
      setTeams(json);
    } catch (err) {
      console.error("Failed to auto-form teams", err);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Scoreboard</h2>

      <div className="overflow-x-auto">
        <table className="table-auto border w-full text-left">
          <thead>
            <tr>
              <th className="border p-2">Player</th>
              <th className="border p-2">Composite</th>
              <th className="border p-2">Categories</th>
            </tr>
          </thead>
          <tbody>
            {data.map((player, idx) => (
              <tr key={idx} className="odd:bg-gray-50">
                <td className="border p-2">{player.name || "Unnamed"}</td>
                <td className="border p-2 font-bold">{player.composite?.toFixed(2)}</td>
                <td className="border p-2">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(player.scores || {}).map(([cat, val]) => (
                      <span
                        key={cat}
                        className="px-2 py-1 bg-gray-200 rounded text-sm"
                      >
                        {cat}: {val}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simple placeholder chart */}
      <div className="mt-6 p-4 border rounded bg-white shadow">
        <h3 className="text-lg font-semibold mb-2">Chart Visualization</h3>
        <div className="w-full h-40 flex items-center justify-center text-gray-400 border-dashed border-2 border-gray-300 rounded">
          [Chart Placeholder 📊]
        </div>
      </div>

      <button
        onClick={autoFormTeams}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Auto-Form Teams
      </button>

      {teams && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h3 className="font-bold">Team Assignments</h3>
          <pre className="whitespace-pre-wrap text-sm mt-2">
            {JSON.stringify(teams, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}