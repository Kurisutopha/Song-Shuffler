import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Alert } from './StyledComponents';
import { useAuth } from './AuthContext';

const PlaylistInput: React.FC = () => {
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, handleAuth, setIsAuthenticated } = useAuth();


    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            try {
                await handleAuth();
            } catch (err) {
                setError('Failed to initiate authentication. Please try again.');
            }
            return;
        }
    
        setError(null);
        setIsLoading(true);
    
        try {
            // First verify we still have a valid token
            const authResponse = await fetch('http://localhost:8000/auth-status');
            const authData = await authResponse.json();
            
            if (!authData.isAuthenticated) {
                setError('Session expired. Please authenticate again.');
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }
    
            const response = await fetch(
                `http://localhost:8000/api/playlist-tracks?` + 
                `url=${encodeURIComponent(playlistUrl)}&count=1`
            );
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to load playlist');
            }
    
            const data = await response.json();
            if (!data || data.length === 0) {
                throw new Error('No playable tracks found in playlist');
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
        <div>
            <h2 className="text-2xl font-bold mb-6 text-white text-center">
                Enter a Spotify Playlist
            </h2>

            {!isAuthenticated ? (
                <div className="text-center">
                    <p className="mb-4 text-gray-300">
                        Connect with Spotify to start playing
                    </p>
                    <Button onClick={handleAuth}>
                        Connect with Spotify
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        value={playlistUrl}
                        onChange={(e) => setPlaylistUrl(e.target.value)}
                        placeholder="https://open.spotify.com/playlist/..."
                        disabled={isLoading}
                    />
                    
                    {error && (
                        <Alert type="error" message={error} />
                    )}
                    
                    <Button
                        type="submit"
                        disabled={isLoading || !playlistUrl.trim()}
                    >
                        {isLoading ? 'Checking playlist...' : 'Start Game'}
                    </Button>

                    <p className="text-sm text-gray-400 text-center mt-4">
                        Make sure you have Spotify open on this device to play music
                    </p>
                </form>
            )}
        </div>
    );
};

export default PlaylistInput;