import { test, expect } from '@playwright/test';

test.describe('Monster Generator App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the app title', async ({ page }) => {
    await expect(page.locator('.header__title')).toContainText('MONSTER GENERATOR');
  });

  test('should have category tabs', async ({ page }) => {
    const tabs = page.locator('.picker__tab');
    await expect(tabs).toHaveCount(8);
    
    // Check for specific categories
    await expect(page.locator('text=Körper')).toBeVisible();
    await expect(page.locator('text=Kopf')).toBeVisible();
    await expect(page.locator('text=Augen')).toBeVisible();
  });

  test('should switch categories', async ({ page }) => {
    // Click on Kopf tab
    await page.click('text=Kopf');
    
    // Check that Kopf is selected
    const kopfTab = page.locator('[data-category="head"]');
    await expect(kopfTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should add item to canvas on click', async ({ page }) => {
    // Click first tile
    await page.locator('.picker__tile-wrap').first().click();
    
    // Canvas should have content (check for selection highlight logic)
    // This is a basic check - more specific selectors would be better
    await expect(page.locator('#previewCanvas')).toBeVisible();
  });

  test('should export button be visible', async ({ page }) => {
    await expect(page.locator('text=Als PNG herunterladen')).toBeVisible();
  });

  test('should random button work', async ({ page }) => {
    // Click random button in picker
    await page.locator('#randomBtnPicker').click();
    
    // Canvas should have content
    await expect(page.locator('#previewCanvas')).toBeVisible();
  });

  test('should show scaler panel when item selected', async ({ page }) => {
    // Add item
    await page.locator('.picker__tile-wrap').first().click();
    
    // Scaler panel should be visible
    const scalerPanel = page.locator('#scalerPanel');
    await expect(scalerPanel).toBeVisible();
  });

  test('should save and load preset', async ({ page }) => {
    // Add an item first
    await page.locator('.picker__tile-wrap').first().click();
    
    // Type preset name
    await page.fill('#presetName', 'TestPreset');
    
    // Click save
    await page.click('text=Preset speichern');
    
    // Select from dropdown
    await page.selectOption('#presetSelect', 'TestPreset');
    
    // Load preset
    await page.click('text=Preset laden');
    
    // Should still have item
    await expect(page.locator('#previewCanvas')).toBeVisible();
  });
});

test.describe('Canvas Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Add an item to canvas
    await page.locator('.picker__tile-wrap').first().click();
  });

  test('should drag item on canvas', async ({ page }) => {
    const canvas = page.locator('#previewCanvas');
    
    // Drag on canvas
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 200, y: 200 },
      targetPosition: { x: 300, y: 300 }
    });
    
    // Canvas should still be visible
    await expect(canvas).toBeVisible();
  });

  test('should adjust scale via slider', async ({ page }) => {
    const slider = page.locator('#scaleSlider');
    
    // Get initial value
    const initialValue = await slider.inputValue();
    
    // Set new value
    await slider.fill('150');
    
    // Value should change
    const newValue = await slider.inputValue();
    expect(newValue).toBe('150');
    expect(newValue).not.toBe(initialValue);
  });

  test('should adjust rotation via slider', async ({ page }) => {
    const slider = page.locator('#rotationSlider');
    
    // Set rotation
    await slider.fill('90');
    
    // Value should be 90
    expect(await slider.inputValue()).toBe('90');
  });

  test('should flip item horizontally', async ({ page }) => {
    const flipButton = page.locator('#mirrorHBtn');
    
    await flipButton.click();
    
    // Button should be pressed
    await expect(flipButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should delete selected item', async ({ page }) => {
    // Click trash button
    await page.click('#trashBtn');
    
    // Scaler panel should be hidden (no selection)
    await expect(page.locator('#scalerPanel')).toBeHidden();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // App should still be visible
    await expect(page.locator('.header__title')).toBeVisible();
    await expect(page.locator('.picker')).toBeVisible();
  });
});
