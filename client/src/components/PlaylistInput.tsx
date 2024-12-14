import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PlaylistInput: React.FC = () => {
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const serverCheck = await fetch('http://localhost:8000/');
            if (!serverCheck.ok) {
                throw new Error('Server is not running. Please start the backend server.');
            }

            const response = await fetch(
                `http://localhost:8000/api/playlist-tracks?` + 
                `url=${encodeURIComponent(playlistUrl)}&count=1`
            );

            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to load playlist');
                } else {
                    throw new Error('Invalid server response. Please check if the server is running correctly.');
                }
            }

            const data = await response.json();
            if (!data || data.length === 0) {
                throw new Error('No tracks found in playlist');
            }

            navigate('/game', { state: { playlistUrl } });
        } catch (err) {
            console.error('Error:', err);
            setError(
                err instanceof Error 
                    ? err.message 
                    : 'An unexpected error occurred. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Enter a Spotify Playlist</h2>
            <p className="text-gray-600 mb-6">
                Paste a link to any public Spotify playlist to use those songs in the game.
                The playlist should contain at least 10 songs with preview URLs available.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    placeholder="https://open.spotify.com/playlist/..."
                    className="w-full p-3 border rounded shadow-sm"
                    disabled={isLoading}
                />
                
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <button
                    type="submit"
                    className={`w-full p-3 rounded text-white font-medium
                        ${isLoading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-500 hover:bg-green-600'}`}
                    disabled={isLoading || !playlistUrl.trim()}
                >
                    {isLoading ? 'Checking playlist...' : 'Start Game'}
                </button>
            </form>
        </div>
    );
};

export default PlaylistInput;