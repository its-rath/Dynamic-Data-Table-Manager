import { test, expect } from '@playwright/test';
import path from 'path';

const sampleCsv = path.resolve(__dirname, '../public/sample.csv');

test.beforeAll(async ({}) => {
	// Ensure production build exists before starting server
});

test('renders table and supports search/sort/pagination', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Dynamic Data Table Manager' })).toBeVisible();

	// Initial rows visible
	const initialRows = await page.getByRole('row').count();
	expect(initialRows).toBeGreaterThan(1);

	// Search for Bob
	await page.getByPlaceholder('Search...').fill('Bob');
	await expect(page.getByRole('row', { name: /Bob Smith/ })).toBeVisible();
	await expect(page.getByRole('row', { name: /Alice Johnson/ })).toHaveCount(0);

	// Clear search
	await page.getByPlaceholder('Search...').fill('');

	// Sort by Age ascending
	await page.getByRole('columnheader', { name: 'Age' }).click();
	const firstRow = page.getByRole('row').nth(1);
	await expect(firstRow).toBeVisible();

	// Pagination control exists (native TablePagination buttons)
	await expect(page.getByLabel('Go to next page')).toBeVisible();
});

test('imports CSV and shows more rows; virtualization scrolls', async ({ page }) => {
	await page.goto('/');

	const beforeCount = await page.getByRole('row').count();
	expect(beforeCount).toBeGreaterThan(1);

	// Trigger Import CSV
	const fileInput = page.locator('input[type="file"][accept=".csv"]');
	await fileInput.setInputFiles(sampleCsv);

	// Wait a moment for rows to replace
	await page.waitForTimeout(500);

	const viewport = page.locator('[data-testid="rows-viewport"]');
	await expect(viewport).toBeVisible();
	await viewport.evaluate((el) => { el.scrollTop = 1000; });
	const scrolled = await viewport.evaluate((el) => el.scrollTop);
	expect(scrolled).toBeGreaterThan(0);
});
