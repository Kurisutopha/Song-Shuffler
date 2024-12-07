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
}