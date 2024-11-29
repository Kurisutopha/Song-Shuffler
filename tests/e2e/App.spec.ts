import { expect, test } from "@playwright/test";
import { clearUser } from "../../src/utils/api";
import {
  setupClerkTestingToken,
  clerk,
  clerkSetup,
} from "@clerk/testing/playwright";


const url = "localhost:8000" 

const SPOOF_UID = "mock-user-id";

const brownUser = {
  strategy: "password",
  email: process.env.E2E_CLERK_USER_USERNAME_1!,
  password: process.env.E2E_CLERK_USER_PASSWORD_1!,
};

const nonBrownUser = {
  strategy: "password",
  email: process.env.E2E_CLERK_USER_USERNAME_2!,
  password: process.env.E2E_CLERK_USER_PASSWORD_2!,
};

const TEST_COORDINATES = [
  { x: 200, y: 200 }, // Center-ish
  { x: 100, y: 100 }, // Top-left
  { x: 300, y: 300 }  // Bottom-right
];

test.beforeEach(async ({ page }) => {
  await page.goto(url);
  
  setupClerkTestingToken({
    page,
    options: { frontendApiUrl: process.env.CLERK_FRONTEND_API },
  });
  
  const loginButton = page.getByRole("button", { name: "Sign in" });
  await expect(loginButton).toBeVisible();

  // This logs in/out via _Clerk_, not via actual component interaction. But that's OK.
  // (Clerk's Playwright guide has an example of filling the login form itself.)
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      password: process.env.E2E_CLERK_USER_PASSWORD_1!,
      identifier: process.env.E2E_CLERK_USER_USERNAME_1!,
    },
  });

  await clerk.loaded({ page });

  await page.getByRole("button", { name: "Section 2: Mapbox Demo" }).click();

});

test('map container renders and is accessible', async ({ page }) => {

  // Check if map container exists
  const mapContainer = page.locator('.map');
  await expect(mapContainer).toBeVisible();
  
  // Check if map container has correct dimensions
  const boundingBox = await mapContainer.boundingBox();
  expect(boundingBox?.width).toBeGreaterThan(0);
  expect(boundingBox?.height).toBeGreaterThan(0);
  
  // Check if map is interactive (can be clicked)
  await mapContainer.click({ position: { x: 100, y: 100 } });
});

test('pins persist through map navigation', async ({ page }) => {
  const mapContainer = page.locator('.map');
  
  // Add a pin
  await mapContainer.click({ position: TEST_COORDINATES[0] });
  
  // Get initial pin count
  const initialPins = page.locator('.lucide-map-pin');
  const initialCount = await initialPins.count();
  
  // Pan the map
  await mapContainer.dragTo(mapContainer, {
    sourcePosition: { x: 200, y: 200 },
    targetPosition: { x: 300, y: 300 },
  });
  
  // Wait for any animations to complete
  await page.waitForTimeout(500);
  
  // Verify pins are still present
  const pinsAfterPan = page.locator('.lucide-map-pin');
  await expect(pinsAfterPan).toHaveCount(initialCount);
});

test('clear button is always visible', async ({ page }) => {
  // Check if clear button is visible initially
  
  const clearButton = page.getByText("Clear My Pins");//page.getByRole('button', { name: 'Clear My Pins' });
  await expect(clearButton).toBeVisible();
  
  // Add some pins
  const mapContainer = page.locator('.map');
  await mapContainer.click({ position: TEST_COORDINATES[0] });
  
  // Verify button is still visible
  await expect(clearButton).toBeVisible();
  
  // Clear pins
  await clearButton.click();
  
  // Verify button remains visible even with no pins
  await expect(clearButton).toBeVisible();
});

// Test authentication states for different users
test("both types of users should see map after sign in", async ({ page }) => {
  // Sign out from beforeEach login
  await clerk.signOut({ page });
  
  // Test Brown user
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: brownUser.email,
      password: brownUser.password,
    },
  });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Section 2: Mapbox Demo" }).click();
  await expect(page.locator(".map")).toBeVisible();
  await clerk.signOut({ page });

  // Test non-Brown user
  await clerk.signIn({
    page, 
    signInParams: {
      strategy: "password",
      identifier: nonBrownUser.email,
      password: nonBrownUser.password,
    },
  });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Section 2: Mapbox Demo" }).click();
  await expect(page.locator(".map")).toBeVisible();
});


test("both users should be able to add pins", async ({ page }) => {
  // Sign out from beforeEach login
  await clerk.signOut({ page });

  // Test with Brown user
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: brownUser.email,
      password: brownUser.password,
    },
  });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Section 2: Mapbox Demo" }).click();

  
  const mapContainer = page.locator('.map');
  await mapContainer.click({ position: TEST_COORDINATES[0] });

  await expect(page.locator('.lucide-map-pin')).toBeVisible();
  await clerk.signOut({ page });

  // Test with non-Brown user
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: nonBrownUser.email,
      password: nonBrownUser.password,
    },
  });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Section 2: Mapbox Demo" }).click();

  await mapContainer.click({ position: TEST_COORDINATES[1] });
  await expect(page.locator(".lucide-map-pin")).toHaveCount(2);
});

test("pins should persist through sign out and sign in", async ({ page }) => {
  // Sign out from beforeEach login
  await clerk.signOut({ page });

  // Sign in as Brown user
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: brownUser.email,
      password: brownUser.password,
    },
  });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Section 2: Mapbox Demo" }).click();

  const mapContainer = page.locator('.map');
  await mapContainer.click({ position: TEST_COORDINATES[0] });

  await expect(page.locator('.lucide-map-pin')).toBeVisible();

  // Sign out
  await clerk.signOut({ page });

  // Sign back in as same user
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: brownUser.email,
      password: brownUser.password,
    },
  });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Section 2: Mapbox Demo" }).click();

  // Verify pin is still visible
  await expect(page.locator('.lucide-map-pin')).toBeVisible();
});

test("users should see pins from other users", async ({ page }) => {
  // Sign out from beforeEach login
  await clerk.signOut({ page });

  // First user adds a pin
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: brownUser.email,
      password: brownUser.password,
    },
  });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Section 2: Mapbox Demo" }).click();

  const mapContainer = page.locator('.map');
  await mapContainer.click({ position: TEST_COORDINATES[0] });

  await expect(page.locator('.lucide-map-pin')).toBeVisible();
  await clerk.signOut({ page });

  // Second user should see the pin
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: nonBrownUser.email,
      password: nonBrownUser.password,
    },
  });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Section 2: Mapbox Demo" }).click();

  await expect(page.locator(".mapboxgl-marker")).toBeVisible();
});

test("users should only clear their own pins", async ({ page }) => {
  // Sign out from beforeEach login
  await clerk.signOut({ page });

  // First user adds a pin
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: brownUser.email,
      password: brownUser.password,
    },
  });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Section 2: Mapbox Demo" }).click();

  const mapContainer = page.locator('.map');
  await mapContainer.click({ position: TEST_COORDINATES[0] });

  await clerk.signOut({ page });

  // Second user adds a pin and tries to clear
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: nonBrownUser.email,
      password: nonBrownUser.password,
    },
  });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Section 2: Mapbox Demo" }).click();

  await mapContainer.click({ position: TEST_COORDINATES[1] });

  // Should see both pins
  await expect(page.locator('.lucide-map-pin')).toHaveCount(2);

  // Handle confirmation dialog
  page.on("dialog", (dialog) => dialog.accept());

  // Clear pins
  await page.getByRole("button", { name: "Clear my pins" }).click();

  // Should still see one pin (the Brown user's pin)
  await expect(page.locator('.lucide-map-pin')).toHaveCount(1);
});

test("pin data persists after page reload", async ({ page }) => {
  
  const mapContainer = page.locator('.map');
  await mapContainer.click({ position: TEST_COORDINATES[0] });
  await expect(page.locator('.mapboxgl-marker')).toBeVisible();
  await page.waitForSelector('.mapboxgl-marker');
  await page.locator('.mapboxgl-marker').click();
  const originalText = await page.locator(".mapboxgl-popup p").textContent();
  await page.locator(".mapboxgl-popup-close-button").click();

  // Reload the page
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.locator('.mapboxgl-marker').click();
  await expect(page.locator(".mapboxgl-popup p")).toHaveText(originalText || "");
});

// Tests search state persistence
test("search state maintenance", async ({ page }) => {
  const searchTerm = "residential";
  await page.getByLabel("Search:").fill(searchTerm);
  await page.getByRole("button", { name: "Search" }).click();

  // Add pin and reload
  await page.getByRole("button", { name: "Add pin" }).click();
  await page.getByPlaceholder("Write a description...").fill("Search test pin");
  await page.locator(".map").click();
  await page.reload();
  await page.waitForLoadState("networkidle");

  // Verify pin exists after reload
  await expect(page.locator(".mapboxgl-marker")).toBeVisible();
});

// test("search integration with pins", async ({ page }) => {
//   await page.getByLabel("Search:").fill("residential");
//   await page.getByRole("button", { name: "Search" }).click();

//   for (const desc of ["Pin 1", "Pin 2"]) {
//     await page.getByRole("button", { name: "Add pin" }).click();
//     await page.getByPlaceholder("Write a description...").fill(desc);
//     await page.locator(".map").click();
//     await page.waitForTimeout(500);
//   }

//   await page.getByLabel("Search:").fill("commercial");
//   await page.getByRole("button", { name: "Search" }).click();
//   const markers = await page.$$(".mapboxgl-marker");
//   expect(markers.length).toBe(2);
// });

// test("pin data modification", async ({ context }) => {
//   // Create pins in first page
//   const page1 = await context.newPage();
//   await page1.goto(url);
//   await setupClerkTestingToken({ page: page1 });
//   await clerk.signIn({
//     page: page1,
//     signInParams: {
//       strategy: "password",
//       password: process.env.E2E_CLERK_USER_PASSWORD_1!,
//       identifier: process.env.E2E_CLERK_USER_USERNAME_1!,
//     },
//   });
//   await page1.waitForLoadState("networkidle");

//   const mapContainer = page1.locator('.map');
//   await mapContainer.click({ position: TEST_COORDINATES[0] });
//   await page1.waitForSelector(".mapboxgl-marker");

//   // Open second page and verify pin appears
//   const page2 = await context.newPage();
//   await page2.goto(url);
//   await setupClerkTestingToken({ page: page2 });
//   await clerk.signIn({
//     page: page2,
//     signInParams: {
//       strategy: "password",
//       password: process.env.E2E_CLERK_USER_PASSWORD_2!,
//       identifier: process.env.E2E_CLERK_USER_USERNAME_2!,
//     },
//   });
//   await page2.waitForLoadState("networkidle");
//   await page2.getByRole("button", { name: "Section 2: Mapbox Demo" }).click();
//   await page2.waitForSelector(".mapboxgl-marker");

//   // Clear pins in second page
//   page2.on("dialog", dialog => dialog.accept());
//   await page2.getByRole("button", { name: "Clear my pins" }).click();

//   // Verify pins cleared in first page
//   await page1.waitForTimeout(1000);
//   const remainingMarkers = await page1.$$(".mapboxgl-marker");
//   expect(remainingMarkers.length).toBe(0);
// });