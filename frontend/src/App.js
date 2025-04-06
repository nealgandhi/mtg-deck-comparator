import React, { useState } from 'react';
import './App.css';

function App() {
  const [deckAUrl, setDeckAUrl] = useState('');
  const [deckBUrl, setDeckBUrl] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setComparisonResult(null);

    const response = await fetch('http://127.0.0.1:5000/compare_decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deck_a_url: deckAUrl, deck_b_url: deckBUrl }),
    });

    if (response.ok) {
      const data = await response.json();
      setComparisonResult(data);
    } else {
      const errorData = await response.json();
      setError(errorData.error || 'Something went wrong');
    }
  };

  const downloadComparison = () => {
    const deckAUnique = comparisonResult.deck_a_unique;
    const deckBUnique = comparisonResult.deck_b_unique;
    let content = '--- Cards in Deck A but not in Deck B ---\n';
    for (const [card, qty] of Object.entries(deckAUnique)) {
      content += `${card} x${qty}\n`;
    }

    content += '\n--- Cards in Deck B but not in Deck A ---\n';
    for (const [card, qty] of Object.entries(deckBUnique)) {
      content += `${card} x${qty}\n`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'deck_comparison.txt';
    link.click();
  };

  return (
    <div className="App">
      <h1>Compare Two Moxfield Decks</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Deck A URL:</label>
          <input
            type="text"
            value={deckAUrl}
            onChange={(e) => setDeckAUrl(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Deck B URL:</label>
          <input
            type="text"
            value={deckBUrl}
            onChange={(e) => setDeckBUrl(e.target.value)}
            required
          />
        </div>
        <button type="submit">Compare</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {comparisonResult && (
        <div>
           <h2>Comparison Results</h2>
            <button onClick={downloadComparison}>Download Comparison</button>
          <div className="comparison-result">
            <div className="columns">
              <div className="column">
                <h3>Cards in Deck A but not in Deck B</h3>
                {Object.entries(comparisonResult.deck_a_unique).map(([card, qty]) => (
                  <p key={card}>{card} x{qty}</p>
                ))}
              </div>

              <div className="column">
                <h3>Cards in Deck B but not in Deck A</h3>
                {Object.entries(comparisonResult.deck_b_unique).map(([card, qty]) => (
                  <p key={card}>{card} x{qty}</p>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;
