import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Alert } from './StyledComponents';

const PlaylistInput: React.FC = () => {
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    // Listen for messages from the popup window
    useEffect(() => {
        const handleAuthMessage = (event: MessageEvent) => {
            // Only accept messages from our backend URL
            if (event.origin !== 'http://localhost:8000') return;

            if (event.data.type === 'spotify-auth-success') {
                setIsAuthenticated(true);
                checkAuthStatus(); // Recheck auth status after successful login
            }
        };

        window.addEventListener('message', handleAuthMessage);
        return () => window.removeEventListener('message', handleAuthMessage);
    }, []);

    const handleAuth = async () => {
        try {
            console.log('Attempting to connect to Spotify...');
            const response = await fetch('http://localhost:8000/login');
            const data = await response.json();
            
            // Open a popup window for authentication
            const width = 450;
            const height = 730;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;

            window.open(
                data.url,
                'Spotify Login',
                `width=${width},height=${height},left=${left},top=${top}`
            );
        } catch (err) {
            console.error('Auth error:', err);
            setError('Failed to initiate authentication. Please try again.');
        }
    };


    // const handleAuth = async () => {
    //     try {
    //         console.log('Attempting to connect to Spotify...');
    //         const response = await fetch('http://localhost:8000/login');
    //         console.log('Server response:', response);
    //         const data = await response.json();
    //         console.log('Login data:', data);
    //         window.location.href = data.url;
    //     } catch (err) {
    //         console.error('Auth error:', err);
    //         setError('Failed to initiate authentication. Please try again.');
    //     }
    // };

    const checkAuthStatus = async () => {
        try {
            const response = await fetch('http://localhost:8000/auth-status');
            const data = await response.json();
            setIsAuthenticated(data.isAuthenticated);
        } catch (err) {
            setIsAuthenticated(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            handleAuth();
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
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
        <Card>
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
                        onClick={() => {}}
                        disabled={isLoading || !playlistUrl.trim()}
                    >
                        {isLoading ? 'Checking playlist...' : 'Start Game'}
                    </Button>
                </form>
            )}
        </Card>
    );
};

export default PlaylistInput;