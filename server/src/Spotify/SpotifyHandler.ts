import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';
import { SpotifySongsDataSource } from './SpotifySongsDataSource';
import axios from 'axios';

dotenv.config();

export class SpotifyHandler {
    private spotifyApi: SpotifyWebApi;
    private songsDatasource: SpotifySongsDataSource;
    private tokenExpirationTime: number = 0;

    constructor(songsDatasource: SpotifySongsDataSource) {
        if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
            throw new Error('Missing Spotify credentials');
        }

        this.spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET
        });
        this.songsDatasource = songsDatasource;
    }

    private async initializeToken() {
        try {
            const data = await this.spotifyApi.clientCredentialsGrant();
            const accessToken = data.body['access_token'];
            const expiresIn = data.body['expires_in'];
            
            this.spotifyApi.setAccessToken(accessToken);
            this.tokenExpirationTime = Date.now() + (expiresIn * 1000) - 60000;
            console.log('Token initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize token:', error);
            return false;
        }
    }

    private async ensureValidToken() {
        if (Date.now() >= this.tokenExpirationTime) {
            return this.initializeToken();
        }
        return true;
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
            
            await this.ensureValidToken();
            const accessToken = this.spotifyApi.getAccessToken();
            console.log('Access token obtained');
            
            const playlistId = this.extractPlaylistId(playlistUrl);
            console.log('Getting tracks for playlist:', playlistId);

            const metadataResponse = await axios.get(
                `https://api.spotify.com/v1/playlists/${playlistId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Playlist metadata retrieved:', {
                name: metadataResponse.data.name,
                totalTracks: metadataResponse.data.tracks.total,
                isPublic: metadataResponse.data.public
            });

            if (!metadataResponse.data.tracks.total) {
                throw new Error('Playlist appears to be empty');
            }

            // Get the first batch of tracks
            const tracksResponse = await axios.get(
                `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        limit: 100,
                        market: 'US'
                    }
                }
            );

            console.log('Initial tracks response received');
            
            let availableTracks = [];
            let tracksChecked = 0;

            for (const item of tracksResponse.data.items) {
                if (!item.track) {
                    console.log('Skipping item - no track data');
                    continue;
                }

                tracksChecked++;
                
                console.log(`Track "${item.track.name}": preview_url ${item.track.preview_url ? 'available' : 'not available'}`);

                if (item.track.preview_url) {
                    availableTracks.push({
                        id: item.track.id,
                        name: item.track.name,
                        preview_url: item.track.preview_url,
                        artists: item.track.artists.map((artist: any) => ({
                            name: artist.name
                        }))
                    });

                    if (availableTracks.length >= numberOfSongs) {
                        break;
                    }
                }
            }

            console.log(`Checked ${tracksChecked} tracks, found ${availableTracks.length} with preview URLs`);

            if (availableTracks.length === 0) {
                throw new Error(`No tracks with preview URLs found after checking ${tracksChecked} songs. Try a different playlist or region.`);
            }

            if (availableTracks.length < numberOfSongs) {
                console.warn(`Warning: Only found ${availableTracks.length} tracks with previews out of ${tracksChecked} checked`);
            }

            return availableTracks;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Axios error details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message
                });
            }
            throw error;
        }
    }
}