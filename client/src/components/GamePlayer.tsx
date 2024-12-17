import React from 'react';
import { Play, Pause, SkipForward } from 'lucide-react';
import SpotifyPlayback from './SpotifyPlayback';

interface GamePlayerProps {
  trackUri?: string;
  isPlaying: boolean;
  onSkip: () => void;
  skipsRemaining: number;
  timeLeft: number;
  disabled?: boolean;
}

const GamePlayer: React.FC<GamePlayerProps> = ({ 
  trackUri, 
  isPlaying,
  onSkip,
  skipsRemaining,
  timeLeft,
  disabled = false
}) => {
  return (
    <div className="w-full space-y-4">
      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-1000"
          style={{ width: `${(timeLeft / 30) * 100}%` }}
        />
      </div>
      
      <div className="flex justify-center items-center gap-4">
        <div className="w-3 h-3 rounded-full animate-pulse bg-green-500" 
          style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
        />
        
        <div className="text-gray-400 font-mono">
          00:{timeLeft.toString().padStart(2, '0')}
        </div>
        
        {skipsRemaining > 0 && (
          <button
            onClick={onSkip}
            disabled={disabled}
            className={`p-2 rounded-full transition-colors
              ${disabled 
                ? 'bg-gray-700 text-gray-500' 
                : 'bg-gray-600 hover:bg-gray-500 text-white'
              }`}
          >
            <SkipForward size={20} />
            <span className="sr-only">Skip Song</span>
          </button>
        )}
        
        {skipsRemaining > 0 && (
          <div className="text-sm text-gray-400">
            {skipsRemaining} skips left
          </div>
        )}
      </div>

      <SpotifyPlayback
        trackUri={trackUri}
        playbackDuration={30000}
      />
    </div>
  );
};

export default GamePlayer;