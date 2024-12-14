import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Track {
  id: string;
  name: string;
  preview_url: string;
  artists: { name: string }[];
}

const Game: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [guess, setGuess] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); 
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const playlistUrl = location.state?.playlistUrl;
    if (!playlistUrl) {
      navigate('/');
      return;
    }

    const fetchTracks = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/playlist-tracks?` +
          `url=${encodeURIComponent(playlistUrl)}&count=10`
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch tracks');
        }
        
        const trackData = await response.json();
        if (trackData.length === 0) {
          throw new Error('No tracks with preview URLs found in this playlist. Try a different playlist.');
        }
        
        setTracks(trackData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tracks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTracks();
  }, [location.state, navigate]);

  useEffect(() => {
    if (!gameStarted || showAnswer) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          handleTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, showAnswer]);

  const handleTimeUp = useCallback(() => {
    if (audioElement) {
      audioElement.pause();
    }
    setShowAnswer(true);
    setTimeout(() => {
      setShowAnswer(false);
      setTimeLeft(30);
      setGuess('');
      setCurrentTrackIndex(prev => prev + 1);
    }, 3000);
  }, [audioElement]);

  useEffect(() => {
    if (tracks[currentTrackIndex]) {
      const audio = new Audio(tracks[currentTrackIndex].preview_url);
      setAudioElement(audio);
      return () => {
        audio.pause();
        audio.remove();
      };
    }
  }, [currentTrackIndex, tracks]);

  const startGame = () => {
    setGameStarted(true);
    if (audioElement) {
      audioElement.play();
    }
  };

  const handleGuess = () => {
    const currentTrack = tracks[currentTrackIndex];
    const isCorrect = 
      guess.toLowerCase() === currentTrack.name.toLowerCase() ||
      currentTrack.artists.some(artist => 
        guess.toLowerCase() === artist.name.toLowerCase()
      );

    if (isCorrect) {
      const timeBonus = Math.floor(timeLeft / 5);
      setScore(score + 10 + timeBonus);
      if (audioElement) {
        audioElement.pause();
      }
      setShowAnswer(true);
      setTimeout(() => {
        setShowAnswer(false);
        setTimeLeft(30);
        setGuess('');
        setCurrentTrackIndex(prev => prev + 1);
      }, 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button
          onClick={() => navigate('/')}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (currentTrackIndex >= tracks.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
        <p className="text-xl mb-4">Final Score: {score}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {!gameStarted ? (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Play?</h2>
          <button
            onClick={startGame}
            className="bg-green-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-600"
          >
            Start Game
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-xl font-semibold">Score: {score}</div>
            <div className="text-xl font-semibold">Time: {timeLeft}s</div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-600 mb-2">Song {currentTrackIndex + 1} of {tracks.length}</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
              placeholder="Enter song title or artist name..."
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={showAnswer}
            />

            <button
              onClick={handleGuess}
              disabled={showAnswer || !guess.trim()}
              className={`w-full p-3 rounded-lg text-white font-medium
                ${showAnswer || !guess.trim() 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600'}`}
            >
              Submit Guess
            </button>
          </div>

          {showAnswer && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
              <p className="text-green-700">
                The song was "{tracks[currentTrackIndex].name}" by{' '}
                {tracks[currentTrackIndex].artists.map(a => a.name).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Game;