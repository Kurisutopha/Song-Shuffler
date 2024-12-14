import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';

dotenv.config();

interface Artist {
    name: string;
}

interface Track {
    id: string;
    name: string;
    preview_url: string | null;
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

    private async refreshTokenIfNeeded(): Promise<void> {
        if (Date.now() >= this.tokenExpirationTime) {
            try {
                const data = await this.spotifyApi.refreshAccessToken();
                this.spotifyApi.setAccessToken(data.body['access_token']);
                this.setTokenExpirationTime(data.body['expires_in']);
                console.log('Token refreshed successfully');
            } catch (error) {
                console.error('Error refreshing token:', error);
                throw new Error('Failed to refresh access token');
            }
        }
    }

    private extractPlaylistId(playlistUrl: string): string {
        console.log('Extracting playlist ID from URL:', playlistUrl);
        const playlistMatch = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
        if (playlistMatch) {
            console.log('Extracted playlist ID:', playlistMatch[1]);
            return playlistMatch[1];
        }
        
        if (playlistUrl.match(/^[a-zA-Z0-9]{22}$/)) {
            console.log('URL is already a playlist ID:', playlistUrl);
            return playlistUrl;
        }
        
        throw new Error('Invalid playlist URL or ID format');
    }

    async getTracksFromPlaylist(playlistUrl: string, numberOfSongs: number) {
        try {
            console.log(`Attempting to get ${numberOfSongs} tracks from playlist`);
            await this.refreshTokenIfNeeded();
            
            const playlistId = this.extractPlaylistId(playlistUrl);
            console.log('Getting tracks for playlist:', playlistId);

            const response = await this.spotifyApi.getPlaylistTracks(playlistId, {
                limit: 100,
                offset: 0,
                fields: 'items(track(id,name,preview_url,artists(name)))'
            });

            const items = response.body.items as PlaylistTrackItem[];
            console.log(`Retrieved ${items.length} tracks from playlist`);

            const tracksWithPreviews = items
                .filter((item): item is {track: Track} => {
                    return item.track !== null && 
                           item.track.preview_url !== null && 
                           item.track.preview_url !== undefined;
                })
                .map(item => ({
                    id: item.track.id,
                    name: item.track.name,
                    preview_url: item.track.preview_url,
                    artists: item.track.artists.map(artist => ({
                        name: artist.name
                    }))
                }));

            console.log(`Found ${tracksWithPreviews.length} tracks with preview URLs`);

            if (tracksWithPreviews.length === 0) {
                throw new Error('No tracks with preview URLs found in this playlist. Try a different playlist.');
            }

            const shuffled = [...tracksWithPreviews].sort(() => Math.random() - 0.5);
            const selectedTracks = shuffled.slice(0, Math.min(numberOfSongs, shuffled.length));
            
            console.log('Selected tracks:', selectedTracks.map(t => t.name));
            return selectedTracks;

        } catch (error) {
            console.error('Error fetching playlist:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to get tracks: ${error.message}`);
            }
            throw error;
        }
    }
}