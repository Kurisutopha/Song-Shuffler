import React, { useEffect, useState, useCallback, useRef } from 'react';

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
  const playerRef = useRef<Spotify.Player | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSDKReady, setIsSDKReady] = useState(false);
  
  const clearPlaybackTimer = useCallback(() => {
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, []);

  const startPlayback = useCallback(async () => {
    if (!playerRef.current || !trackUri || !deviceIdRef.current || !isSDKReady) {
      console.log('Missing requirements for playback:', { 
        hasPlayer: !!playerRef.current, 
        hasTrackUri: !!trackUri,
        deviceId: deviceIdRef.current,
        isSDKReady 
      });
      return;
    }

    clearPlaybackTimer();

    try {
      const tokenResponse = await fetch('http://localhost:8000/get-token');
      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }
      const { accessToken } = await tokenResponse.json();

      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [trackUri],
            position_ms: 0,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Playback error details:', error);
        throw new Error('Failed to start playback');
      }

      playbackTimerRef.current = setTimeout(async () => {
        try {
          await playerRef.current?.pause();
          onPlaybackComplete?.();
        } catch (error) {
          console.error('Error pausing playback:', error);
        }
      }, playbackDuration);

    } catch (error) {
      console.error('Playback error:', error);
      onError?.(error instanceof Error ? error : new Error('Playback failed'));
    }
  }, [trackUri, playbackDuration, onPlaybackComplete, onError, isSDKReady, clearPlaybackTimer]);

  useEffect(() => {
    if (window.Spotify) {
      setIsSDKReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      setIsSDKReady(true);
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!isSDKReady || playerRef.current) return;

    const player = new window.Spotify.Player({
      name: 'Chime In Game Player',
      getOAuthToken: async (cb) => {
        try {
          const response = await fetch('http://localhost:8000/get-token');
          if (!response.ok) throw new Error('Failed to get access token');
          const data = await response.json();
          cb(data.accessToken);
        } catch (error) {
          console.error('Error getting token:', error);
          onError?.(new Error('Failed to get access token'));
        }
      }
    });

    player.addListener('ready', ({ device_id }) => {
      console.log('Player ready with Device ID:', device_id);
      deviceIdRef.current = device_id;
      onReady?.();
    });

    player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline:', device_id);
      deviceIdRef.current = null;
    });

    const errorTypes = ['initialization_error', 'authentication_error', 'account_error', 'playback_error'];
    errorTypes.forEach(type => {
      player.addListener(type, ({ message }) => {
        console.error(`${type}:`, message);
        onError?.(new Error(message));
      });
    });

    player.addListener('player_state_changed', onStateChange);

    player.connect().then(success => {
      if (success) {
        console.log('Successfully connected to Spotify');
        playerRef.current = player;
      } else {
        console.error('Failed to connect to Spotify');
        onError?.(new Error('Failed to connect to Spotify'));
      }
    });

    return () => {
      clearPlaybackTimer();
      player.disconnect();
      playerRef.current = null;
    };
  }, [isSDKReady, onReady, onError, onStateChange, clearPlaybackTimer]);

  useEffect(() => {
    if (trackUri) {
      startPlayback();
    }
    
    return () => {
      clearPlaybackTimer();
    };
  }, [trackUri, startPlayback, clearPlaybackTimer]);

  return null;
};

export default SpotifyPlayback;