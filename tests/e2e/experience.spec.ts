import { expect, type Page, test } from '@playwright/test';

/** Errores de JS y de consola de toda la sesión: cada test termina exigiendo que no haya. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function ready(page: Page, path = '/'): Promise<void> {
  await page.goto(path);
  await expect(page.locator('html')).toHaveAttribute('data-ready', '', { timeout: 15_000 });
}

test('carga, muestra el nombre y cae a modo estático sin GPU', async ({ page }) => {
  const errors = watchErrors(page);
  await ready(page);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('EMILIANO');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('SANTO TOMÁS');
  // Chromium headless renderiza por software → el sitio no monta el canvas.
  await expect(page.locator('html')).toHaveAttribute('data-gfx', 'static');
  await expect(page.locator('.stage canvas')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('con WebGL forzado monta el canvas sin errores', async ({ page }) => {
  const errors = watchErrors(page);
  await ready(page, '/?gfx=low');
  await expect(page.locator('.stage canvas')).toHaveCount(1);
  await page.mouse.move(400, 300);
  await page.mouse.wheel(0, 2500);
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test('el scroll cambia de sección y de etapa', async ({ page }) => {
  const errors = watchErrors(page);
  await ready(page);
  const section = (id: string) => page.locator(`#${id}`);

  await section('origin').evaluate((element) => window.scrollTo(0, (element as HTMLElement).offsetTop + 10));
  await expect(page.locator('.origin__rail li[aria-current="step"]')).toContainText('HARDWARE');

  await section('origin').evaluate((element) => {
    const origin = element as HTMLElement;
    window.scrollTo(0, origin.offsetTop + origin.offsetHeight - window.innerHeight);
  });
  await expect(page.locator('.origin__rail li[aria-current="step"]')).toContainText('INTERACTIVE EXPERIENCES');

  await section('contact').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('.hud__where')).toContainText('READY');
  await expect(page.getByRole('link', { name: 'emilianost95@gmail.com' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('abrir, recorrer y cerrar un proyecto', async ({ page }) => {
  const errors = watchErrors(page);
  await ready(page);
  const row = page.getByRole('button', { name: /GESTOR DE PRECIOS & STOCK/ });
  await row.scrollIntoViewIfNeeded();
  await row.click();

  const viewer = page.getByRole('dialog', { name: /Proyecto: GESTOR/ });
  await expect(viewer).toBeVisible();
  await expect(viewer).toContainText('SYSTEM ONLINE');
  await expect(viewer).toContainText('TypeScript');
  await expect(page.locator('html')).toHaveAttribute('data-state', 'SYSTEM');
  await expect(page.locator('main')).toHaveAttribute('inert', '');

  await viewer.getByRole('button', { name: /NEXT/ }).click();
  await expect(page.getByRole('dialog', { name: /Proyecto: CONSTRUCT-OS/ })).toContainText('DATA PENDING');

  await page.getByRole('button', { name: /CLOSE/ }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
  expect(errors).toEqual([]);
});

test('ESC cierra el proyecto y devuelve el foco a la fila', async ({ page }) => {
  await ready(page);
  const row = page.getByRole('button', { name: /SMARTGROW/ });
  await row.scrollIntoViewIfNeeded();
  await row.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: /SMARTGROW/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(row).toBeFocused();
});

test('la matriz del stack responde al foco', async ({ page }) => {
  await ready(page);
  const tech = page.getByRole('button', { name: 'ESP32', exact: true });
  await tech.scrollIntoViewIfNeeded();
  await tech.focus();
  const readout = page.getByLabel('Detalle de la tecnología elegida');
  await expect(readout.getByRole('heading')).toHaveText('ESP32');
  await expect(readout.locator('li[data-lit]')).toHaveText(/SmartGrow/);
});

test('el playground enciende y apaga un experimento', async ({ page }) => {
  const errors = watchErrors(page);
  await ready(page);
  const run = page.getByRole('button', { name: /RUN FLOW FIELD/ });
  await run.scrollIntoViewIfNeeded();
  await run.click();
  await expect(page.locator('.tile[data-running]')).toHaveCount(1);
  await page.getByRole('button', { name: /RUN SPRING TYPE/ }).click();
  await expect(page.locator('.tile[data-running]')).toHaveCount(1);
  await page.getByRole('button', { name: /STOP SPRING TYPE/ }).click();
  await expect(page.locator('.tile[data-running]')).toHaveCount(0);

  await page.getByRole('button', { name: 'IOT', exact: true }).click();
  await expect(page.locator('.tile')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('con reduced motion no hay intro y el contenido está visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await expect(page.locator('.intro')).toHaveCount(0);
  await expect(page.locator('.hero .split__char').first()).toHaveCSS('opacity', '1');
});

test('no hay scroll horizontal', async ({ page }) => {
  await ready(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test.describe('teclado y secretos', () => {
  test.skip(({ isMobile }) => isMobile, 'atajos de teclado: solo escritorio');

  test('E abre la terminal; system y open funcionan; ESC la cierra', async ({ page }) => {
    const errors = watchErrors(page);
    await ready(page);
    await page.keyboard.press('e');
    const terminal = page.getByRole('dialog', { name: 'Terminal' });
    await expect(terminal).toBeVisible();
    const input = terminal.getByLabel('Comando');
    await expect(input).toBeFocused();

    await input.fill('system');
    await input.press('Enter');
    await expect(terminal).toContainText('STATUS: ONLINE');
    await expect(terminal).toContainText('WEBGL: DISABLED (STATIC MODE)');

    await input.fill('goto playground');
    await input.press('Enter');
    await expect(page.locator('.hud__rail li[aria-current="step"]')).toContainText('PLAYGROUND');

    await input.fill('open 3');
    await input.press('Enter');
    await expect(page.getByRole('dialog', { name: /SMARTGROW/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('SHIFT alterna DEEP MODE, pero Shift+Tab no', async ({ page }) => {
    await ready(page);
    const html = page.locator('html');
    await page.keyboard.press('Shift');
    await expect(html).toHaveAttribute('data-state', 'DEEP MODE');
    await page.keyboard.press('Shift+Tab');
    await expect(html).toHaveAttribute('data-state', 'DEEP MODE');
    await page.keyboard.press('Shift');
    await expect(html).toHaveAttribute('data-state', 'CORE');
  });

  test('el código Konami activa el modo arco', async ({ page }) => {
    await ready(page);
    for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) {
      await page.keyboard.press(key);
    }
    await expect(page.locator('html')).toHaveAttribute('data-forge', '');
    await expect(page.getByText(/ARC STRUCK/)).toBeVisible();
  });

  test('las teclas 1–6 navegan y Tab alcanza los controles', async ({ page }) => {
    await ready(page);
    await page.keyboard.press('4');
    await expect(page.locator('.hud__rail li[aria-current="step"]')).toContainText('STACK');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  });

  test('un click sostenido muestra la telemetría', async ({ page }) => {
    await ready(page);
    await page.mouse.move(700, 300);
    await page.mouse.down();
    await expect(page.locator('.telemetry')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-state', 'SYSTEM');
    await page.mouse.up();
    await expect(page.locator('.telemetry')).toHaveCount(0);
  });
});

test.describe('pantalla angosta', () => {
  test.skip(({ isMobile }) => !isMobile, 'índice a pantalla completa: solo móvil');

  test('INDEX abre el índice y navega', async ({ page }) => {
    await ready(page);
    await page.getByRole('button', { name: 'INDEX' }).click();
    const index = page.getByRole('dialog', { name: 'Índice' });
    await expect(index).toBeVisible();
    await index.getByRole('button', { name: /PLAYGROUND/ }).click();
    await expect(index).toHaveCount(0);
    await expect(page.locator('.hud__where')).toContainText('PLAYGROUND');
  });
});
