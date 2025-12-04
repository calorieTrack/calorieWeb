import { useState, useEffect } from 'react';
import { getAISuggestions } from '../api';
import './AISuggestions.css';

function AISuggestions({ entries }) {
    const [suggestions, setSuggestions] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const data = await getAISuggestions();
            setSuggestions(data);
        } catch (err) {
            console.error('Failed to fetch AI suggestions:', err);
            setSuggestions('Failed to load suggestions. Please try again.');
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
                <button 
                    className="ai-refresh-button" 
                    onClick={fetchSuggestions}
                    disabled={loading}
                    title="Refresh suggestions"
                >
                    {loading ? '⏳' : '🔄'}
                </button>
            </div>
            <div className="ai-suggestions-text">
                <p>{loading ? 'Loading suggestions...' : (suggestions || 'No suggestions available')}</p>
            </div>
        </div>
    );
}

export default AISuggestions;