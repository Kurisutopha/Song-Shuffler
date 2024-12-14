import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { SpotifyHandler } from './Spotify/SpotifyHandler';
import dotenv from 'dotenv';
import { RequestHandler } from 'express-serve-static-core';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const spotifyHandler = new SpotifyHandler();

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

const healthCheck: RequestHandler = (_req, res) => {
  res.json({ message: 'Server is running!' });
};


const login: RequestHandler = (_req, res) => {
  try {
    const scopes = ['playlist-read-private', 'playlist-read-collaborative'];
    const state = Math.random().toString(36).substring(7);
    const authorizeURL = spotifyHandler.spotifyApi.createAuthorizeURL(scopes, state);
    
    console.log('Generated auth URL:', authorizeURL);
    res.json({ url: authorizeURL });
  } catch (error) {
    console.error('Error generating login URL:', error);
    res.status(500).json({ error: 'Failed to generate login URL' });
  }
};

const callback: RequestHandler = async (req, res) => {
  const code = req.query.code as string | undefined;
  const error = req.query.error as string | undefined;

  if (error) {
    console.error('Auth error:', error);
    res.redirect('http://localhost:5173?error=auth_failed');
    return;
  }

  if (!code) {
    res.status(400).json({ error: 'Invalid code parameter' });
    return;
  }

  try {
    const data = await spotifyHandler.spotifyApi.authorizationCodeGrant(code);
    spotifyHandler.spotifyApi.setAccessToken(data.body['access_token']);
    spotifyHandler.spotifyApi.setRefreshToken(data.body['refresh_token']);
    spotifyHandler.setTokenExpirationTime(data.body['expires_in']);
    res.redirect('http://localhost:5173');
  } catch (error) {
    console.error('Error in callback:', error);
    res.redirect('http://localhost:5173?error=auth_failed');
  }
};

const authStatus: RequestHandler = (_req, res) => {
  const isAuthenticated = spotifyHandler.hasValidToken();
  res.json({ isAuthenticated });
};

const getPlaylistTracks: RequestHandler = async (req, res) => {
  const playlistUrl = req.query.url as string;
  const count = parseInt(req.query.count as string) || 10;

  if (!playlistUrl) {
    res.status(400).json({ error: 'Playlist URL is required' });
    return;
  }

  try {
    const tracks = await spotifyHandler.getTracksFromPlaylist(playlistUrl, count);
    res.json(tracks);
  } catch (error) {
    console.error('Error in /api/playlist-tracks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tracks',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

app.get('/', healthCheck);
app.get('/login', login);
app.get('/callback', callback);
app.get('/auth-status', authStatus);
app.get('/api/playlist-tracks', getPlaylistTracks);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});