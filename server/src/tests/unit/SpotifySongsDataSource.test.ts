import { SpotifySongsDataSource } from '../../Spotify/SpotifySongsDataSource';
import SpotifyWebApi from 'spotify-web-api-node';

describe('SpotifySongsDataSource', () => {
  let dataSource: SpotifySongsDataSource;
  let mockSpotifyApi: jest.Mocked<SpotifyWebApi>;

  beforeEach(() => {
    mockSpotifyApi = new SpotifyWebApi() as jest.Mocked<SpotifyWebApi>;
    dataSource = new SpotifySongsDataSource(mockSpotifyApi);
  });

  describe('chooseRandomSongs', () => {
    const mockTracks: SpotifyApi.TrackObjectFull[] = [
      { id: '1', name: 'Track 1' },
      { id: '2', name: 'Track 2' },
      { id: '3', name: 'Track 3' },
      { id: '4', name: 'Track 4' },
      { id: '5', name: 'Track 5' }
    ] as SpotifyApi.TrackObjectFull[];

    test('should return requested number of unique tracks', async () => {
      const count = 3;
      const result = await dataSource.chooseRandomSongs(mockTracks, count);
      
      expect(result).toHaveLength(count);
      // Verify all tracks are unique
      const uniqueIds = new Set(result.map(track => track.id));
      expect(uniqueIds.size).toBe(count);
    });

    test('should throw error if not enough unique tracks available', async () => {
      // First select 4 tracks
      await dataSource.chooseRandomSongs(mockTracks, 4);
      
      // Try to select 2 more tracks when only 1 is left
      await expect(dataSource.chooseRandomSongs(mockTracks, 2))
        .rejects
        .toThrow('Not enough unique songs available for selection.');
    });

    test('should not repeat previously chosen tracks', async () => {
      // Select 2 tracks first
      const firstSelection = await dataSource.chooseRandomSongs(mockTracks, 2);
      // Select 2 more tracks
      const secondSelection = await dataSource.chooseRandomSongs(mockTracks, 2);
      
      // Combine all selected tracks
      const allSelected = [...firstSelection, ...secondSelection];
      const uniqueIds = new Set(allSelected.map(track => track.id));
      
      // Verify all 4 tracks are unique
      expect(uniqueIds.size).toBe(4);
    });
  });

  describe('getRandomElements', () => {
    test('should return random subset of array', () => {
      const array = [1, 2, 3, 4, 5];
      const count = 3;
      
      const result = dataSource['getRandomElements'](array, count);
      
      expect(result).toHaveLength(count);
      result.forEach(element => {
        expect(array).toContain(element);
      });
    });

    test('should maintain uniqueness', () => {
      const array = [1, 2, 3, 4, 5];
      const count = 3;
      
      const result = dataSource['getRandomElements'](array, count);
      const uniqueElements = new Set(result);
      
      expect(uniqueElements.size).toBe(count);
    });
  });
});