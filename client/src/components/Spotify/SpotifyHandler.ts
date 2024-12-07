import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';
dotenv.config()

class SpotifyHandler {
    private spotifyApi: SpotifyWebApi;
    private tokenExpirationTime: number = 0;

    constructor() {
        this.spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET
        });
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

    async getPopularSongsByGenre(genre: string) {
        await this.initializeToken();
        return await this.spotifyApi.getRecommendations({
            seed_genres: [genre],
            min_popularity: 70,
            // something to think about for us:
            // varying difficulties, if you know a lot of rock songs, and its a lot of the same popular rock songs being played, the game might be boring
            // maybe we can have difficulty "modes", where the minimum popularity can range from like 80, 70, to maybe 50 as a "hard" mode
            limit: 50 // API limit BTW
        });
    }
}