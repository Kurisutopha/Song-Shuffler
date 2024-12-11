// In your backend server file (e.g., index.ts or server.js)
import express from 'express';
import {SpotifyHandler} from './Spotify/SpotifyHandler';
import { SpotifySongsDataSource } from './Spotify/SpotifySongsDataSource';
import SpotifyWebApi from 'spotify-web-api-node';



const app = express();
const spotifyAPI = new SpotifyWebApi;
const dataSource = new SpotifySongsDataSource(spotifyAPI);
const spotifyHandler = new SpotifyHandler(dataSource);

app.get('/api/songs', async (req, res) => {
    console.log("before genre");
  const genre = req.query.genre as string;
  console.log("before recieved songs");
  try {
    console.log("before recieved songs in try block");
    const songs = await spotifyHandler.getPopularSongsByGenre(genre, 10, 70); // Fetch 10 random songs
    res.json(songs);
    console.log("recieved songs, which are:", songs)
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching songs');
  }
});

app.listen(8000, () => {
  console.log('Server running on http://localhost:8000');
});
