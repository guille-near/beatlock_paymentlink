import React, { useState } from 'react';

const BeatstarsStripeIntegration = () => {
  const [url, setUrl] = useState('');
  const [beatInfo, setBeatInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [testMessage, setTestMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setBeatInfo(null);
    try {
      const response = await fetch('/api/process-beat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ beatstarsUrl: url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      setBeatInfo(data.beatInfo);
    } catch (err) {
      console.error('Failed to process the request:', err);
      setError(`Failed to process the request: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testBackend = async () => {
    try {
      const response = await fetch('/api/test');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTestMessage(data.message);
    } catch (err) {
      setTestMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="container">
      <button onClick={testBackend} className="button">Test Backend</button>
      {testMessage && <p className="testMessage">{testMessage}</p>}

      <form onSubmit={handleSubmit} className="form">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter Beatstars URL"
          required
          className="input"
        />
        <button type="submit" disabled={isLoading} className="button">
          {isLoading ? 'Processing...' : 'Process Beat'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {beatInfo && (
        <div className="info">
          <h2 className="title">Beat Info:</h2>
          <pre>{JSON.stringify(beatInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default BeatstarsStripeIntegration;
