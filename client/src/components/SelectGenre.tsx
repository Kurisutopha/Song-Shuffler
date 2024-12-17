import React, { useState, useEffect } from "react";
import "../styles/App.css";
import { SpotifyHandler } from "./Spotify/SpotifyHandler";
import { SpotifySongsDataSource } from "./Spotify/SpotifySongsDataSource";
import SpotifyWebApi from "spotify-web-api-node";

const APIController = {
  clientId: '177ead92a8e945a8a5803f19edd3db14',
  clientSecret: '279ea60b873a40a081ad542b519c577f',

  async getToken() {
    try {
      const result = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded', 
          'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`)
        },
        body: 'grant_type=client_credentials'
      });

      const data = await result.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async getGenres(token: string) {
    try {
      const result = await fetch('https://api.spotify.com/v1/browse/categories?locale=sv_US', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
      });

      const data = await result.json();
      return data.categories.items;
    } catch (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
  },

  async getPlaylistByGenre(token: string, genreId: string) {
    try {
      const limit = 10;
      console.log(token);
      const result = await fetch(`https://api.spotify.com/v1/search?q=genre%3A${genreId}&type=playlist&limit=${limit}`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log(result);

      const data = await result.json();
      return data.playlists.items;
    } catch (error) {
      console.error('Error fetching playlists:', error);
      return [];
    }
  },

  async getTracksFromPlaylist(token: string, playlistId: string) {
    try {
      const result = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
      });

      const data = await result.json();
      return data.items;
    } catch (error) {
      console.error('Error fetching tracks:', error);
      return [];
    }
  }
};

function SelectGenre() {
  const [popularSongs, setPopularSongs] = useState<SpotifyApi.TrackObjectFull[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [genres, setGenres] = useState([]);


  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const fetchedToken = await APIController.getToken();
        if (fetchedToken) {
          setToken(fetchedToken);
          const fetchedGenres = await APIController.getGenres(fetchedToken);
          setGenres(fetchedGenres);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, []);
  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
  });
  const songsDatasource = new SpotifySongsDataSource(spotifyApi);
  const spotifyHandler = new SpotifyHandler(songsDatasource);

  const handleGenreSelect = async (genre: string) => {
    if (!token) return;
    try {
      // Fetch popular songs for the selected genre
      // The count parameter determines how many songs to retrieve
      // The difficulty parameter affects song popularity (lower = less popular songs)
      //const songs = await spotifyHandler.getPopularSongsByGenre(genre.toLowerCase(), 5, 70);
      const songs = await spotifyHandler.getPlaylistByGenre(token, genre)
      
      // Update state with the retrieved songs
      setPopularSongs(songs);

      // Log songs to console
      console.log(`Popular ${genre} Songs:`, songs);
    } catch (error) {
      console.error(`Error fetching ${genre} songs:`, error);
    }

  }
  /*
  const [genres, setGenres] = useState([]);
  const [token, setToken] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const fetchedToken = await APIController.getToken();
        if (fetchedToken) {
          setToken(fetchedToken);
          const fetchedGenres = await APIController.getGenres(fetchedToken);
          setGenres(fetchedGenres);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  const handleGenreSelect = async (genreId: string) => {
    if (!token) return;

    try {
      const fetchedPlaylists = await APIController.getPlaylistByGenre(token, genreId);
      console.log(fetchedPlaylists)
      setPlaylists(fetchedPlaylists);
      // If playlists exist, fetch tracks from the first playlist
      if (fetchedPlaylists.length > 0) {
        const fetchedTracks = await APIController.getTracksFromPlaylist(token, fetchedPlaylists[0].id);
        setTracks(fetchedTracks);
        console.log(fetchedTracks);
      }
    } catch (error) {
      console.error('Error selecting genre:', error);
    }
  };*/

  return (
    <div className="App">
      <div className="app">
        <h1 className="title">Select a Genre</h1>
        <div className="genre-buttons">
          {['rock', 'pop', 'edm', 'classical'].map((genre) => (
            <button
              key={genre}
              className="genre-button"
              onClick={() => handleGenreSelect(genre)}
            >
              {genre.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SelectGenre;