import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, Card, Button, Input, Alert, ScoreDisplay, GameProgress } from './StyledComponents';

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

          <div className="space-y-4">
            <Input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Enter song title or artist name..."
              disabled={showAnswer}
            />

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