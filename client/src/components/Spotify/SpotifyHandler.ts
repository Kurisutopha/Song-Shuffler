import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';
import { SpotifySongsDataSource } from './SpotifySongsDataSource';
//dotenv.config()

export class SpotifyHandler {
    private spotifyApi: SpotifyWebApi;
    private tokenExpirationTime: number = 0;
    private songsDatasource: SpotifySongsDataSource;

    constructor(songsDatasource: SpotifySongsDataSource) {
        this.spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET
        });
        this.songsDatasource = songsDatasource;
    }

    private async initializeToken() {
        try {
            const data = await this.spotifyApi.clientCredentialsGrant();
            this.spotifyApi.setAccessToken(data.body.access_token);
            return true;
        } catch (error) {
            console.error('Error getting Spotify credentials', error);
            return false;
        }
    }

    async getAvailableGenres() {
        await this.initializeToken();
        return this.spotifyApi.getAvailableGenreSeeds();
    }

    async getPlaylistByGenre(token: string, genreId: string) {
        try {
          const limit = 10;
          console.log(token);
          //const result = await fetch('https://api.spotify.com/v1/recommendations?seed_genres=${genreId}')
          const result = await fetch(`https://api.spotify.com/v1/search?q=genre%3A${genreId}&type=track&limit=10`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
          });
          console.log(result);
    
          const data = await result.json();
          console.log(data)
          //return data.playlists.items;
          return data.tracks.items;
        } catch (error) {
          console.error('Error fetching playlists:', error);
          return [];
        }
      }

    async getPopularSongsByGenre(genre: string, count: number, difficulty: number) {
        await this.initializeToken();
        const recommendations = await this.spotifyApi.getRecommendations({
            seed_genres: [genre],
            min_popularity: difficulty,
            //min popularity used to be 70.
            // something to think about for us:
            // varying difficulties, if you know a lot of rock songs, and its a lot of the same popular rock songs being played, the game might be boring
            // maybe we can have difficulty "modes", where the minimum popularity can range from like 80, 70, to maybe 50 as a "hard" mode
            limit: 50 // API limit BTW
        });
            //Place getrandom songs here and implement it. Instead of returning reccomendations, return the list of randomized songs.
            //const tracks = recommendations.body.tracks


            //conform tracks object, which is currently a ReccomendationTrack Object
            //to TrackObject full so that it can work with the method from datasource
            const tracks = recommendations.body.tracks.map(track => ({
                ...track,
                album: {
                    ...track.album,
                    album_type: track.album.album_type.toLowerCase() as "album" | "single" | "compilation",
                },
            })) as SpotifyApi.TrackObjectFull[];

            //Get random songs from the recommendations
            const randomSongs = await this.songsDatasource.chooseRandomSongs(tracks, count);
            console.log(randomSongs);
            return randomSongs;
    }
}