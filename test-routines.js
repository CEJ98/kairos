const puppeteer = require('puppeteer');

(async () => {
	try {
		const browser = await puppeteer.launch({ headless: false });
		const page = await browser.newPage();

		// Navegar a la página de inicio
		await page.goto('http://localhost:3000');
		await page.waitForTimeout(2000);

		// Ir a signin
		await page.goto('http://localhost:3000/signin');
		await page.waitForSelector('input[type="email"]');

		// Llenar credenciales demo
		await page.type('input[type="email"]', 'demo@kairos.com');
		await page.type('input[type="password"]', 'demo123');

		// Hacer click en el botón de login
		await page.click('button[type="submit"]');
		await page.waitForTimeout(3000);

		// Verificar que estamos en el dashboard
		const currentUrl = page.url();
		console.log('URL actual después del login:', currentUrl);

		// Buscar el enlace de rutinas y hacer click
		const routinesLink = await page.$('a[href="/dashboard/workouts"]');
		if (routinesLink) {
			console.log('✅ Enlace de rutinas encontrado');
			await routinesLink.click();
			await page.waitForTimeout(2000);

			const finalUrl = page.url();
			console.log('URL después de click en rutinas:', finalUrl);

			if (finalUrl.includes('/dashboard/workouts')) {
				console.log('✅ Navegación a rutinas exitosa');
			} else {
				console.log('❌ Error: No se pudo navegar a rutinas');
			}
		} else {
			console.log('❌ Error: Enlace de rutinas no encontrado');
		}

		await browser.close();
	} catch (error) {
		console.error('Error en el test:', error);
	}
})();