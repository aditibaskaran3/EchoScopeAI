import axios from "axios";
import { useState, useEffect } from "react";
import "./App.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // 🌙 Toggle theme
  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  const analyzeText = async () => {
    setLoading(true);

    const texts = text.split("\n").filter(t => t.trim() !== "");

    const res = await axios.post("http://127.0.0.1:5000/analyze", {
      texts: texts,
    });

    setResult(res.data);
    setLoading(false);
  };

  // 📁 CSV Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target.result;
      setText(content);
    };

    reader.readAsText(file);
  };

  // 🔍 Highlight suspicious words
  const highlightText = (text) => {
    const suspicious = ["free", "win", "click", "money", "offer"];
    let highlighted = text;

    suspicious.forEach(word => {
      const regex = new RegExp(`(${word})`, "gi");
      highlighted = highlighted.replace(regex, `<span class="highlight-word">$1</span>`);
    });

    return highlighted;
  };

  // Insights
  const getTopGroup = () => {
    if (!result.length) return null;
    return result.reduce((max, g) =>
      g.avg_risk > max.avg_risk ? g : max
    );
  };

  const getAverageRisk = () => {
    if (!result.length) return 0;
    return (
      result.reduce((sum, g) => sum + g.avg_risk, 0) / result.length
    ).toFixed(2);
  };

  const getAllKeywords = () => {
    if (!result.length) return [];
    return [...new Set(result.flatMap(g => g.keywords))].slice(0, 6);
  };

  const chartData = result.map((g) => ({
    name: `Group ${g.echo_group}`,
    risk: g.avg_risk,
  }));

  return (
    <div className="app">

      {/* NAVBAR */}
      <div className="navbar">
        <h2>EchoScope AI</h2>

        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      {/* HERO */}
      <div className="hero">
        <h1>Tracking the echoes of misinformation</h1>
        <p>Analyze trends and detect misleading patterns</p>
      </div>

      {/* INPUT */}
      <div className="input-section">

        <textarea
          placeholder="Enter multiple texts (one per line)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="actions">
          <button onClick={analyzeText}>
            Analyze
          </button>

          <input type="file" onChange={handleFileUpload} />
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="loading">
          <p>🔍 Scanning signal patterns...</p>
        </div>
      )}

      {/* INSIGHTS */}
      {result.length > 0 && (
        <div className="insights">

          <div className="insight-card highlight">
            <h3>⚠️ Top Signal</h3>
            <p>
              Group {getTopGroup().echo_group} — {getTopGroup().avg_risk}%
            </p>
          </div>

          <div className="insight-card">
            <h3>📊 Avg Risk</h3>
            <p>{getAverageRisk()}%</p>
          </div>

          <div className="insight-card">
            <h3>🔑 Patterns</h3>
            <p>{getAllKeywords().join(", ")}</p>
          </div>

        </div>
      )}

      {/* CHART */}
      {result.length > 0 && (
        <div className="chart-container">
          <h3>Risk Distribution</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="#334155" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="risk" fill="#38bdf8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* RESULTS */}
      <div className="results">
        {result.map((group, index) => (
          <div className="card" key={index}>
            <h2>Echo Group {group.echo_group}</h2>

            <p className="risk">Risk: {group.avg_risk}%</p>

            <p className="keywords">
              Keywords: {group.keywords.join(", ")}
            </p>

            <ul>
              {group.texts.map((t, i) => (
                <li
                  key={i}
                  dangerouslySetInnerHTML={{
                    __html: highlightText(t),
                  }}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

    </div>
  );
}

export default App;