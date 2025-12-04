import { useState, useEffect } from 'react';
import { getAISuggestions } from '../api';
import './AISuggestions.css';

<<<<<<< HEAD
function AISuggestions({ entries }) {
    const [suggestions, setSuggestions] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchSuggestions = async () => {
        setLoading(true);
=======
function AISuggestions() {
    const [suggestions, setSuggestions] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSuggestions = async () => {
        setLoading(true);
        setError(null);
>>>>>>> origin/main
        try {
            const data = await getAISuggestions();
            setSuggestions(data);
        } catch (err) {
<<<<<<< HEAD
            console.error('Failed to fetch AI suggestions:', err);
            setSuggestions('Failed to load suggestions. Please try again.');
=======
            console.error('Failed to fetch AI suggestions:', err.message);
            setError(err.message);
>>>>>>> origin/main
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);

    return (
        <div className="ai-suggestions">
            <div className="ai-suggestions-header">
                <h2 className="ai-suggestions-h2">AI Suggestions</h2>
<<<<<<< HEAD
                <button 
                    className="ai-refresh-button" 
=======
                <button
                    className="ai-refresh-button"
>>>>>>> origin/main
                    onClick={fetchSuggestions}
                    disabled={loading}
                    title="Refresh suggestions"
                >
<<<<<<< HEAD
                    {loading ? '⏳' : '🔄'}
                </button>
            </div>
            <div className="ai-suggestions-text">
                <p>{loading ? 'Loading suggestions...' : (suggestions || 'No suggestions available')}</p>
=======
                    {loading ? (
                        <span className="material-symbols-outlined" aria-hidden>hourglass_empty</span>
                    ) : (
                        <span className="material-symbols-outlined" aria-hidden>refresh</span>
                    )}
                </button>
            </div>
            <div className="ai-suggestions-textbox">
                {loading ? (
                    <p>Loading suggestions...</p>
                ) : error ? (
                    <p className="ai-error">Error: {error}</p>
                ) : Array.isArray(suggestions?.suggestions) ? (
                    <div className="ai-suggestions-list">
                        <ul>
                            {suggestions.suggestions.map((it, idx) => (
                                <li key={idx} className="ai-suggestion-item">
                                    <span className="ai-suggestion-name">{it.name}</span>
                                    <span className="ai-suggestion-rationale">{it.rationale}</span>
                                </li>
                            ))}
                        </ul>
                        {suggestions.note && <div className="ai-suggestion-note">{suggestions.note}</div>}
                    </div>
                ) : (
                    <p>No suggestions available</p>
                )}
>>>>>>> origin/main
            </div>
        </div>
    );
}

export default AISuggestions;