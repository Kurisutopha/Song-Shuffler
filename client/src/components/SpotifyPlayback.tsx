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

  const startPlayback = useCallback(async () => {
    if (!player || !trackUri) return;

    try {
      const deviceId = await new Promise<string>((resolve) => {
        player.getCurrentState().then(state => {
          player.getVolume().then(volume => {
            resolve(state?.device_id || '');
          });
        });
      });

      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('spotify_access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [trackUri],
          position_ms: 0,
        }),
      });

      const timer = setTimeout(async () => {
        await player.pause();
        onPlaybackComplete?.();
      }, playbackDuration);

      setPlaybackTimer(timer);
    } catch (error) {
      console.error('Playback error:', error);
      onError?.(error instanceof Error ? error : new Error('Playback failed'));
    }
  }, [player, trackUri, playbackDuration, onPlaybackComplete, onError]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Chime In Game Player',
        getOAuthToken: cb => {
          const accessToken = localStorage.getItem('spotify_access_token');
          cb(accessToken || '');
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
        onStateChange?.(state);
      });

      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setPlayer(player);
        onReady?.();
      });

      player.connect();
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
  }, []);

  useEffect(() => {
    if (playbackTimer) {
      clearTimeout(playbackTimer);
    }
    if (player && trackUri) {
      startPlayback();
    }
  }, [player, trackUri, startPlayback]);

  return null;
};

export default SpotifyPlayback;