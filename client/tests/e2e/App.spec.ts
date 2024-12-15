import { expect, test } from "@playwright/test";

test.describe('Home Page Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page before each test
    await page.goto('http://localhost:5173/');
  });

  test('should show welcome message', async ({ page }) => {
    await expect(page.getByText('Welcome to Chime In')).toBeVisible();
  });

  test('should show game rules', async ({ page }) => {
    await expect(page.getByText('Rules of the game:')).toBeVisible();
    await expect(page.getByText("try to guess the songs!")).toBeVisible();
  });

  test('should show Connect with Spotify button before authentication', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /Connect with Spotify/i });
    await expect(connectButton).toBeVisible();
  });

  test('playlist input should not be visible before authentication', async ({ page }) => {
    const urlInput = page.getByPlaceholder('https://open.spotify.com/playlist/...');
    await expect(urlInput).not.toBeVisible();
  });
});

test.describe('Game Page Component Tests', () => {
  test('should redirect to home if accessed directly', async ({ page }) => {
    // Try to access game page directly
    await page.goto('http://localhost:5173/game');
    
    // Should redirect to home page since no playlist is selected
    await expect(page).toHaveURL('http://localhost:5173/');
  });
});

test.describe('Authentication Flow', () => {
  test('clicking Spotify connect should redirect to Spotify login', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    
    // Intercept the redirect to Spotify
    const [response] = await Promise.all([
      page.waitForResponse(resp => 
        resp.url().includes('http://localhost:8000/login') &&
        resp.status() === 200
      ),
      page.getByRole('button', { name: /Connect with Spotify/i }).click()
    ]);

    const data = await response.json();
    expect(data.url).toContain('accounts.spotify.com');
  });
});