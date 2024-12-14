import SpotifyWebApi from 'spotify-web-api-node';

export class SpotifySongsDataSource {
    private spotifyApi: SpotifyWebApi;
    private chosenSongsSet: Set<string>;

    constructor(spotifyApi: SpotifyWebApi) {
        this.spotifyApi = spotifyApi;
        this.chosenSongsSet = new Set<string>();
    }

    async chooseRandomSongs(tracks: SpotifyApi.TrackObjectFull[], count: number): Promise<SpotifyApi.TrackObjectFull[]> {
        try {
            const unchosenTracks = tracks.filter(track => !this.chosenSongsSet.has(track.id));

            if (unchosenTracks.length < count) {
                throw new Error('Not enough unique songs available for selection.');
            }

            const selectedSongs = this.getRandomElements(unchosenTracks, count);
            selectedSongs.forEach(song => this.chosenSongsSet.add(song.id));
            
            return selectedSongs;
        } catch (error) {
            console.error('Error choosing random songs:', error);
            throw error;
        }
    }

    private getRandomElements<T>(array: T[], count: number): T[] {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}