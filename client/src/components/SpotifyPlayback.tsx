import React, { useEffect, useState, useCallback } from 'react';

interface SpotifyPlaybackProps {
  trackUri?: string;
  playbackDuration?: number;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: any) => void;
  onPlaybackComplete?: () => void;
}

const SpotifyPlayback: React.FC<SpotifyPlaybackProps> = ({
  trackUri,
  playbackDuration = 30000,
  onReady,
  onError,
  onStateChange,
  onPlaybackComplete,
}) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [playbackTimer, setPlaybackTimer] = useState<NodeJS.Timeout | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const startPlayback = useCallback(async () => {
    if (!player || !trackUri || !deviceId) {
        console.log('Missing requirements:', { 
            hasPlayer: !!player, 
            hasTrackUri: !!trackUri,
            deviceId 
        });
        return;
    }

    try {
        // Get fresh token from backend first
        const tokenResponse = await fetch('http://localhost:8000/get-token');
        if (!tokenResponse.ok) {
            throw new Error('Failed to get access token');
        }
        const { accessToken } = await tokenResponse.json();

        // Try to play with device ID
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                uris: [trackUri],
                position_ms: 0,
            }),
        });

        console.log('Playback response:', response.status);
        if (!response.ok) {
            const error = await response.json();
            console.error('Playback error details:', error);
            throw new Error('Failed to start playback');
        }

        // Set timer for playback duration
        const timer = setTimeout(async () => {
            try {
                await player.pause();
                onPlaybackComplete?.();
            } catch (error) {
                console.error('Error pausing playback:', error);
            }
        }, playbackDuration);

        setPlaybackTimer(timer);

    } catch (error) {
        console.error('Playback error:', error);
        onError?.(error instanceof Error ? error : new Error('Playback failed'));
    }
  }, [player, trackUri, deviceId, playbackDuration, onPlaybackComplete, onError]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
            name: 'Chime In Game Player',
            getOAuthToken: async (cb) => {
                try {
                    const response = await fetch('http://localhost:8000/get-token');
                    if (!response.ok) {
                        throw new Error('Failed to get access token');
                    }
                    const data = await response.json();
                    cb(data.accessToken);
                } catch (error) {
                    console.error('Error getting token:', error);
                    onError?.(new Error('Failed to get access token'));
                }
            }
        });

        player.addListener('initialization_error', ({ message }) => {
            console.error('Failed to initialize:', message);
            onError?.(new Error(message));
        });

        player.addListener('authentication_error', ({ message }) => {
            console.error('Failed to authenticate:', message);
            onError?.(new Error(message));
        });

        player.addListener('account_error', ({ message }) => {
            console.error('Failed to validate Spotify account:', message);
            onError?.(new Error(message));
        });

        player.addListener('playback_error', ({ message }) => {
            console.error('Failed to perform playback:', message);
            onError?.(new Error(message));
        });

        player.addListener('player_state_changed', (state) => {
            console.log('Player state changed:', state);
            onStateChange?.(state);
        });

        player.addListener('ready', ({ device_id }) => {
            console.log('Player ready with Device ID:', device_id);
            setDeviceId(device_id);
            setPlayer(player);
            onReady?.();
        });

        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline:', device_id);
            setDeviceId(null);
        });

        player.connect().then(success => {
            if (!success) {
                console.error('Failed to connect to Spotify');
            } else {
                console.log('Successfully connected to Spotify');
            }
        });
    };

    return () => {
        if (playbackTimer) {
            clearTimeout(playbackTimer);
        }
        if (player) {
            player.disconnect();
        }
        document.body.removeChild(script);
    };
  }, [onError, onReady, onStateChange]);

  useEffect(() => {
    if (playbackTimer) {
      clearTimeout(playbackTimer);
    }
    if (player && trackUri && deviceId) {
      startPlayback();
    }
  }, [player, trackUri, deviceId, startPlayback, playbackTimer]);

  return null;
};

export default SpotifyPlayback;