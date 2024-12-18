import request from 'supertest';
import { app } from '../../Index';  // Import the app
import dotenv from 'dotenv';

dotenv.config();

describe('Spotify API Integration Tests', () => {
  // Remove the playlistId check since we don't need it for these basic endpoint tests
  
  describe('Authentication', () => {
    test('login endpoint should return Spotify authorization URL', async () => {
      const response = await request(app)
        .get('/login')
        .expect(200);

      // Check response structure
      expect(response.body).toHaveProperty('url');
      expect(response.body.url).toContain('accounts.spotify.com/authorize');
    });

    test('auth-status should return false for no token', async () => {
      const response = await request(app)
        .get('/auth-status')
        .expect(200);

      expect(response.body).toHaveProperty('isAuthenticated');
      expect(response.body.isAuthenticated).toBe(false);
    });
  });

  describe('Playlist Tracks', () => {
    test('should return error for missing playlist URL', async () => {
      const response = await request(app)
        .get('/api/playlist-tracks')
        .expect(400);

      expect(response.body.error).toBe('Playlist URL is required');
    });

    test('should return error for invalid playlist URL', async () => {
      const response = await request(app)
        .get('/api/playlist-tracks')
        .query({ url: 'invalid-url' })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Failed to fetch tracks');
    });
  });

  // Add more test cases for other endpoints
  describe('Clear Auth', () => {
    test('should successfully clear authentication', async () => {
      const response = await request(app)
        .get('/clear-auth')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });
  });

  describe('Health Check', () => {
    test('should return server status', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Server is running!');
    });
  });
});