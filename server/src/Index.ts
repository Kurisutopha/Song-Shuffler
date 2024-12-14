import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { SpotifyHandler } from './Spotify/SpotifyHandler';
import { SpotifySongsDataSource } from './Spotify/SpotifySongsDataSource';
import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const spotifyAPI = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

const dataSource = new SpotifySongsDataSource(spotifyAPI);
const spotifyHandler = new SpotifyHandler(dataSource);

app.get('/', function(_req: Request, res: Response) {
  res.json({ message: 'Server is running!' });
});

app.get('/api/playlist-tracks', async function(req: Request, res: Response) {
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
    res.status(500).json({ 
      error: 'Failed to fetch tracks',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});