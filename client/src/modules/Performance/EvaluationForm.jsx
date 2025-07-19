import React, { useState } from "react";

const categories = [
  "Serving",
  "Serve Receive",
  "Setting",
  "Blocking",
  "Attacking",
  "Leadership",
  "Communication",
  "Coachability",
];

export default function EvaluationForm() {
  const [scores, setScores] = useState(
    categories.reduce((acc, cat) => ({ ...acc, [cat]: 3 }), {})
  );
  const [weights, setWeights] = useState(
    categories.reduce((acc, cat) => ({ ...acc, [cat]: 1 }), {})
  );
  const [position, setPosition] = useState("");

  const handleScoreChange = (cat, value) => {
    setScores((prev) => ({ ...prev, [cat]: Number(value) }));
  };

  const handleWeightChange = (cat, value) => {
    setWeights((prev) => ({ ...prev, [cat]: Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      position,
      scores,
      weights,
    };

    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Please login first');
      return;
    }

    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit");
      alert("Evaluation submitted ✔️");
      
      // Reset form
      setPosition("");
      setScores(categories.reduce((acc, cat) => ({ ...acc, [cat]: 3 }), {}));
      setWeights(categories.reduce((acc, cat) => ({ ...acc, [cat]: 1 }), {}));
    } catch (err) {
      console.error(err);
      alert("Error submitting ❗");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-4 bg-white shadow rounded space-y-4"
    >
      <h2 className="text-xl font-bold">Player Evaluation Form</h2>
      <div>
        <label className="block text-sm font-medium">Position</label>
        <input
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="mt-1 w-full border rounded p-2"
          placeholder="e.g. Outside Hitter"
          required
        />
      </div>

      {categories.map((cat) => (
        <div key={cat} className="grid grid-cols-3 items-center gap-2">
          <label className="font-medium">{cat}</label>
          <select
            value={scores[cat]}
            onChange={(e) => handleScoreChange(cat, e.target.value)}
            className="border p-1 rounded"
          >
            {[1, 2, 3, 4, 5].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={weights[cat]}
            min="0"
            step="0.1"
            onChange={(e) => handleWeightChange(cat, e.target.value)}
            className="border p-1 rounded"
            placeholder="Weight"
          />
        </div>
      ))}

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit Evaluation
      </button>
    </form>
  );
}