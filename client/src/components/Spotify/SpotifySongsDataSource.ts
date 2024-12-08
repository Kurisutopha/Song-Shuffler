import SpotifyWebApi from 'spotify-web-api-node';

export class SpotifySongsDataSource {
    private spotifyApi: SpotifyWebApi;
    private chosenSongsSet: Set<string>; // Tracks chosen songs by their IDs

    constructor(spotifyApi: SpotifyWebApi) {
        this.spotifyApi = spotifyApi;
        this.chosenSongsSet = new Set<string>();
    }

    /**
     * Fetches a random selection of songs from a given playlist.
     * Ensures songs in the `chosenSongsSet` are not selected.
     * @param playlistId - The Spotify playlist ID to fetch songs from.
     * @param count - Number of random songs to select.
     * @returns An array of random song objects.
     */
    async chooseRandomSongs(playlistId: string, count: number): Promise<SpotifyApi.TrackObjectFull[]> {
        
        try {
            const playlistData = await this.spotifyApi.getPlaylistTracks(playlistId);
            const tracks = playlistData.body.items
            .map(item => item.track) // Extract the track
            .filter((track): track is SpotifyApi.TrackObjectFull => track !== null && track.id !== undefined); // Null check and type guard
            
            // Filter out songs already chosen 
                const unchosenTracks = tracks.filter(track =>  !this.chosenSongsSet.has(track.id));

            if (unchosenTracks.length < count) {
                throw new Error('Not enough unique songs available for selection.');
            }

            // Shuffle and select the requested number of songs
            const selectedSongs = this.getRandomElements(unchosenTracks, count);

            // Add selected songs to the chosen set
            selectedSongs.forEach(song => this.chosenSongsSet.add(song.id));
            
            return selectedSongs;
        
        } catch (error) {
            console.error('Error choosing random songs:', error);
            throw error;
        }
    }

    /**
     * Adds a song to the chosen set to prevent it from being randomly selected again.
     * @param songId - The Spotify song ID to add.
     */
    addSongToSet(songId: string): void {
        this.chosenSongsSet.add(songId);
    }

    /**
     * Utility function to select random elements from an array.
     * @param array - The source array to pick from.
     * @param count - Number of elements to pick.
     * @returns An array of random elements.
     */
    private getRandomElements<T>(array: T[], count: number): T[] {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}
