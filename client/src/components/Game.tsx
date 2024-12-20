import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Layout, Card, Button, Input, Alert, ScoreDisplay, GameProgress } from './StyledComponents';
import GamePlayer from './GamePlayer';

interface Track {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
}

const Game: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [guess, setGuess] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [gameStarted, setGameStarted] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(true);
  const [skipsRemaining, setSkipsRemaining] = useState(5);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Track[]>([]); // New state for filtered suggestions
  const [showDropdown, setShowDropdown] = useState(true); 
  // Toggle dropdown visibility

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    
    const input = e.target.value;
    setGuess(input);
    
    setShowDropdown(true);
    if (input.trim() === '') {
      setShowDropdown(false);
      setFilteredSuggestions([]);

      return;
    }

    console.log(tracks);

    const suggestions = tracks
      .filter((track) => {
        const trackName = track.name.toLowerCase();
        const artistNames = track.artists.map(artist => artist.name.toLowerCase());
        const inputLower = input.toLowerCase();
        
        return trackName.includes(inputLower) || 
               artistNames.some(name => name.includes(inputLower));
      })
      .slice(0, 5);
    
      console.log(suggestions);

    setFilteredSuggestions(suggestions);
    setShowDropdown(true);
  };

  const handleSuggestionClick = (suggestion: Track) => {
    setGuess(suggestion.name);
    setShowDropdown(false); // Hide dropdown after selection
  };


  useEffect(() => {
    const isPageRefresh = (
      window.performance &&
      window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD
    );

    if (isPageRefresh || !isAuthenticated) {
      console.log('Invalid game state or page refreshed, redirecting to home...');
      navigate('/');
      return;
    }
  }, [isAuthenticated, navigate]);

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
          `url=${encodeURIComponent(playlistUrl)}&count=15`
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch tracks');
        }
        
        const trackData = await response.json();
        if (trackData.length === 0) {
          throw new Error('No tracks found in this playlist.');
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
    setIsPlaying(false);
    setShowAnswer(true);
    setTimeout(() => {
      setShowAnswer(false);
      setTimeLeft(30);
      setGuess('');
      setCurrentTrackIndex(prev => prev + 1);
      if (currentTrackIndex < tracks.length - 1) {
        setIsPlaying(true);
      }
    }, 1000);
  }, [currentTrackIndex, tracks.length]);

  const startGame = () => {
    setTimeout(() => {
      setIsPlaying(false);
    }, 500);
    setGameStarted(true);
    setTimeLeft(30);
    setTimeout(() => {
      setIsPlaying(true);
    }, 1000);
  };

  const handleSkip = useCallback(() => {
    if (skipsRemaining > 0) {
      setIsPlaying(false);
      setSkipsRemaining(prev => prev - 1);
      setTimeLeft(30);
      
      setTimeout(() => {
        setCurrentTrackIndex(prev => prev + 1);
        setIsPlaying(true);
      }, 500);
    }
  }, [skipsRemaining]);
  
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
      setIsPlaying(false);
      setShowAnswer(true);
      setTimeout(() => {
        setShowAnswer(false);
        setTimeLeft(10);
        setGuess('');
        setCurrentTrackIndex(prev => prev + 1);
        if (currentTrackIndex < tracks.length - 1) {
          setIsPlaying(true);
        }
      }, 1000);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-xl text-white">Loading game...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Card>
          <Alert type="error" message={error} />
          <Button onClick={() => navigate('/')} variant="secondary">
            Back to Home
          </Button>
        </Card>
      </Layout>
    );
  }

  if (currentTrackIndex >= tracks.length) {
    return (
      <Layout>
        <Card>
          <h2 className="text-2xl font-bold mb-4 text-white text-center">Game Over!</h2>
          <p className="text-xl mb-6 text-center text-green-400">Final Score: {score}</p>
          <Button onClick={() => navigate('/')} variant="primary">
            Play Again
          </Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      {!gameStarted ? (
        <Card>
          <h2 className="text-2xl font-bold mb-6 text-white text-center">Ready to Play?</h2>
          <Button onClick={startGame} variant="primary">
            Start Game
          </Button>
        </Card>
      ) : (
        <Card>
          <ScoreDisplay score={score} timeLeft={timeLeft} />
          <GameProgress 
            current={currentTrackIndex + 1} 
            total={tracks.length} 
          />

          <GamePlayer 
            trackUri={gameStarted ? tracks[currentTrackIndex]?.uri : undefined}
            isPlaying={isPlaying}
            onSkip={handleSkip}
            skipsRemaining={skipsRemaining}
            timeLeft={timeLeft}
            disabled={showAnswer}
          />

          <div className="space-y-4 mt-6">
            <Input
              value={guess}
              onChange={handleInputChange}
              placeholder="Enter song title or artist name..."
              disabled={showAnswer}
            />

{showDropdown && filteredSuggestions.length > 0 && (
    <div className="absolute z-10 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
      {filteredSuggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-white"
          onClick={() => handleSuggestionClick(suggestion)}
        >
          <div className="font-medium">{suggestion.name}</div>
          <div className="text-sm text-gray-400">
            {suggestion.artists.map(a => a.name).join(', ')}
          </div>
        </div>
      ))}
    </div>
  )}

            <Button
              onClick={handleGuess}
              disabled={showAnswer || !guess.trim()}
              variant="primary"
            >
              Submit Guess
            </Button>
          </div>

          {showAnswer && (
            <div className="mt-6 bg-green-900/50 border-l-4 border-green-500 p-4 rounded-lg">
              <p className="text-green-200">
                The song was "{tracks[currentTrackIndex].name}" by{' '}
                {tracks[currentTrackIndex].artists.map(a => a.name).join(', ')}
              </p>
            </div>
          )}
        </Card>
      )}
    </Layout>
  );
};

export default Game;