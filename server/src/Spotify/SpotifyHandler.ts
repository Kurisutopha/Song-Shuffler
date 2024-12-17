import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';

dotenv.config();

interface Artist {
    name: string;
}

interface Track {
    id: string;
    name: string;
    uri: string;
    artists: Artist[];
}

interface PlaylistTrackItem {
    track: Track | null;
}

export class SpotifyHandler {
    readonly spotifyApi: SpotifyWebApi;
    private tokenExpirationTime: number = 0;

    constructor() {
        if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
            throw new Error('Missing Spotify credentials');
        }

        this.spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            redirectUri: process.env.REDIRECT_URI || 'http://localhost:8000/callback'
        });
    }

    setTokenExpirationTime(expiresIn: number) {
        this.tokenExpirationTime = Date.now() + (expiresIn * 1000) - 60000;
    }

    hasValidToken(): boolean {
        const accessToken = this.spotifyApi.getAccessToken();
        return !!accessToken && Date.now() < this.tokenExpirationTime;
    }

    clearTokens() {
        this.spotifyApi.setAccessToken('');
        this.spotifyApi.setRefreshToken('');
        this.tokenExpirationTime = 0;
    }

    private async refreshTokenIfNeeded(): Promise<void> {
        if (Date.now() >= this.tokenExpirationTime) {
            try {
                const data = await this.spotifyApi.refreshAccessToken();
                this.spotifyApi.setAccessToken(data.body['access_token']);
                this.setTokenExpirationTime(data.body['expires_in']);
            } catch (error) {
                console.error('Error refreshing token:', error);
                throw new Error('Failed to refresh access token');
            }
        }
    }

    private extractPlaylistId(playlistUrl: string): string {
        const playlistMatch = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
        if (playlistMatch) {
            return playlistMatch[1];
        }
        
        if (playlistUrl.match(/^[a-zA-Z0-9]{22}$/)) {
            return playlistUrl;
        }
        
        throw new Error('Invalid playlist URL or ID format');
    }

    async getTracksFromPlaylist(playlistUrl: string, numberOfSongs: number) {
        try {
            await this.refreshTokenIfNeeded();
            
            const playlistId = this.extractPlaylistId(playlistUrl);
            
            const response = await this.spotifyApi.getPlaylistTracks(playlistId, {
                limit: 100,
                offset: 0,
                fields: 'items(track(id,name,uri,artists(name)))'
            });

            const items = response.body.items as PlaylistTrackItem[];
            
            const validTracks = items
                .filter((item): item is {track: Track} => {
                    return item.track !== null;
                })
                .map(item => ({
                    id: item.track.id,
                    name: item.track.name,
                    uri: item.track.uri,
                    artists: item.track.artists.map(artist => ({
                        name: artist.name
                    }))
                }));

            if (validTracks.length === 0) {
                throw new Error('No valid tracks found in this playlist.');
            }

            const shuffled = [...validTracks].sort(() => Math.random() - 0.5);
            const selectedTracks = shuffled.slice(0, Math.min(numberOfSongs, shuffled.length));
            
            return selectedTracks;

        } catch (error) {
            console.error('Error fetching playlist:', error);
            throw error;
        }
    }
}