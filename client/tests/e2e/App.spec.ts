import { expect, test } from "@playwright/test";

test.describe('Home Page Component Tests', () => {
  test.beforeEach(async ({ page }) => {
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
    await page.goto('http://localhost:5173/game');
    await expect(page).toHaveURL('http://localhost:5173/');
  });

  test('should redirect to home and require re-auth on refresh', async ({ page }) => {
    // First, go to home page
    await page.goto('http://localhost:5173/');
    
    // Simulate authenticated state
    await page.evaluate(() => {
      window.postMessage(
        { type: 'spotify-auth-success' },
        'http://localhost:5173'
      );
    });

    // Refresh the page
    await page.reload();

    // Should be back on home page
    await expect(page).toHaveURL('http://localhost:5173/');
    
    // Connect button should be visible again
    const connectButton = page.getByRole('button', { name: /Connect with Spotify/i });
    await expect(connectButton).toBeVisible();
  });
});

test.describe('Authentication Flow', () => {
  test('clicking Spotify connect should open auth popup', async ({ page, context }) => {
    await page.goto('http://localhost:5173/');
    
    // Start waiting for popup before clicking button
    const popupPromise = context.waitForEvent('page');
    
    // Click the connect button
    await page.getByRole('button', { name: /Connect with Spotify/i }).click();
    
    // Wait for the popup
    const popup = await popupPromise;
    
    // Verify popup URL
    expect(popup.url()).toContain('accounts.spotify.com');
    
    // Verify popup dimensions
    const boundingBox = await popup.evaluate(() => {
      return {
        width: window.outerWidth,
        height: window.outerHeight
      };
    });
    
    expect(boundingBox.width).toBe(450);
    expect(boundingBox.height).toBe(730);
  });

  test('successful auth should close popup and update main window', async ({ page, context }) => {
    // Navigate to home page
    await page.goto('http://localhost:5173/');
    
    // Start waiting for popup
    const popupPromise = context.waitForEvent('page');
    
    // Click the connect button using proper role selector
    // The Button component renders as a button element with text "Connect with Spotify"
    await page.getByRole('button', { name: 'Connect with Spotify' }).click();
    
    const popup = await popupPromise;
    
    // Simulate successful authentication in popup
    await popup.evaluate(() => {
      window.opener.postMessage(
        { type: 'spotify-auth-success' },
        'http://localhost:5173'
      );
      window.close();
    });
    
    // Wait for popup to close
    await popup.waitForEvent('close');
    
    // Verify playlist input is visible
    // Since Input component is used, we can use the role 'textbox'
    const urlInput = page.getByRole('textbox', { name: 'Enter a Spotify Playlist' });
    await expect(urlInput).toBeVisible();
    
    // Additional verification - check that we're showing the Card component with the form
    const formContainer = page.getByRole('form');
    await expect(formContainer).toBeVisible();
});

  test('failed auth should show error message', async ({ page, context }) => {
    await page.goto('http://localhost:5173/');
    
    // Start waiting for popup
    const popupPromise = context.waitForEvent('page');
    await page.getByRole('button', { name: /Connect with Spotify/i }).click();
    const popup = await popupPromise;
    
    // Simulate authentication error in popup
    await popup.evaluate(() => {
      window.opener.postMessage(
        { type: 'spotify-auth-error', error: 'Failed to authenticate' },
        'http://localhost:5173'
      );
      window.close();
    });
    
    // Verify error message appears
    await expect(page.getByText(/Failed to authenticate/)).toBeVisible();
 });
});

test('should clear auth and return to home page on refresh after authentication', async ({ page, context }) => {
  // Start at home page
  await page.goto('http://localhost:5173/');
  
  // Start authentication flow
  const popupPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Connect with Spotify' }).click();
  
  // Handle popup
  const popup = await popupPromise;
  await popup.evaluate(() => {
    window.opener.postMessage(
      { type: 'spotify-auth-success' },
      'http://localhost:5173'
    );
    window.close();
  });
  
  // Wait for popup to close
  await popup.waitForEvent('close');
  
  // Verify we're authenticated by checking for playlist input
  const urlInput = page.getByRole('textbox');
  await expect(urlInput).toBeVisible();
  
  // Refresh the page
  await page.reload();
  
  // Verify we're back on home page
  await expect(page).toHaveURL('http://localhost:5173/');
  
  // Verify we need to authenticate again by checking for Connect button
  const connectButton = page.getByRole('button', { name: 'Connect with Spotify' });
  await expect(connectButton).toBeVisible();
  
  // Verify playlist input is no longer visible
  await expect(urlInput).not.toBeVisible();
});