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

const clearAuth: RequestHandler = (_req, res) => {
  try {
    spotifyHandler.clearTokens();
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing auth:', error);
    res.status(500).json({ error: 'Failed to clear authentication' });
  }
};

const callback: RequestHandler = async (req, res) => {
  const code = req.query.code as string | undefined;
  const error = req.query.error as string | undefined;

  if (error) {
    console.error('Auth error:', error);
    // Send error message to opener and close window
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage(
              { type: 'spotify-auth-error', error: '${error}' },
              'http://localhost:5173'
            );
            window.close();
          </script>
        </body>
      </html>
    `);
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

    // Send success message to opener and close window
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage(
              { type: 'spotify-auth-success' },
              'http://localhost:5173'
            );
            window.close();
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in callback:', error);
    // Send error message to opener and close window
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage(
              { type: 'spotify-auth-error', error: 'Failed to authenticate' },
              'http://localhost:5173'
            );
            window.close();
          </script>
        </body>
      </html>
    `);
  }
};

const authStatus: RequestHandler = async (_req, res) => {
  try {
    const isAuthenticated = spotifyHandler.hasValidToken();
    
    // If token is invalid, clear it
    if (!isAuthenticated) {
      spotifyHandler.clearTokens();
    }
    
    res.json({ isAuthenticated });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({ error: 'Failed to check authentication status' });
  }
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
app.get('/clear-auth', clearAuth); 
app.get('/api/playlist-tracks', getPlaylistTracks);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});