const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Rutas existentes en la aplicación
const existingRoutes = [
	'/',
	'/contact',
	'/checkout',
	'/checkout/success',
	'/signup',
	'/signin',
	'/pricing',
	'/terms',
	'/privacy',
	'/dashboard',
	'/dashboard/settings',
	'/dashboard/calendar',
	'/dashboard/progress',
	'/dashboard/progress/measurements',
	'/dashboard/workouts',
	'/dashboard/workouts/live',
	'/dashboard/workouts/new',
	'/dashboard/workouts/[id]/complete',
	'/dashboard/workouts/[id]/start',
	'/dashboard/profile',
	'/dashboard/exercises',
	'/dashboard/activities',
	'/dashboard/community',
	'/dashboard/billing',
	'/dashboard/trainer',
	'/dashboard/trainer/clients',
	'/dashboard/trainer/clients/[id]',
	'/dashboard/trainer/workouts',
	'/dashboard/trainer/workouts/new',
	'/dashboard/trainer/calendar',
	'/dashboard/trainer/billing',
	'/admin/backup'
];

// Rutas que faltan pero son referenciadas
const missingRoutes = [];

// Enlaces problemáticos encontrados
const brokenLinks = [];

// Función para extraer enlaces de un archivo
function extractLinksFromFile(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf8');
		const links = [];
		
		// Buscar enlaces Link href
		const linkMatches = content.match(/Link\s+href=["']([^"']+)["']/g);
		if (linkMatches) {
			linkMatches.forEach(match => {
				const href = match.match(/href=["']([^"']+)["']/)[1];
				links.push({ type: 'Link', href, file: filePath });
			});
		}
		
		// Buscar router.push
		const routerMatches = content.match(/router\.push\(["']([^"']+)["']/g);
		if (routerMatches) {
			routerMatches.forEach(match => {
				const href = match.match(/router\.push\(["']([^"']+)["']/)[1];
				links.push({ type: 'router.push', href, file: filePath });
			});
		}
		
		// Buscar window.location
		const windowMatches = content.match(/window\.location\.href\s*=\s*["']([^"']+)["']/g);
		if (windowMatches) {
			windowMatches.forEach(match => {
				const href = match.match(/["']([^"']+)["']/)[1];
				links.push({ type: 'window.location', href, file: filePath });
			});
		}
		
		return links;
	} catch (error) {
		console.error(`Error leyendo archivo ${filePath}:`, error.message);
		return [];
	}
}

// Función para verificar si una ruta existe
function routeExists(route) {
	// Normalizar la ruta
	const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
	
	// Verificar rutas exactas
	if (existingRoutes.includes(normalizedRoute)) {
		return true;
	}
	
	// Verificar rutas dinámicas
	for (const existingRoute of existingRoutes) {
		if (existingRoute.includes('[id]')) {
			const pattern = existingRoute.replace('[id]', '[^/]+');
			const regex = new RegExp(`^${pattern}$`);
			if (regex.test(normalizedRoute)) {
				return true;
			}
		}
	}
	
	// Verificar rutas externas
	if (normalizedRoute.startsWith('http') || normalizedRoute.startsWith('mailto:') || normalizedRoute.startsWith('#')) {
		return true;
	}
	
	return false;
}

// Función principal para auditar enlaces
function auditLinks() {
	console.log('🔍 Iniciando auditoría de enlaces...');
	
	// Obtener todos los archivos TypeScript/JSX
	const files = execSync('find src -name "*.tsx" -o -name "*.ts" | grep -v ".d.ts"', { encoding: 'utf8' })
		.split('\n')
		.filter(file => file.trim());
	
	console.log(`📁 Analizando ${files.length} archivos...`);
	
	let allLinks = [];
	
	// Extraer enlaces de todos los archivos
	files.forEach(file => {
		const links = extractLinksFromFile(file);
		allLinks.push(...links);
	});
	
	console.log(`🔗 Encontrados ${allLinks.length} enlaces`);
	
	// Verificar cada enlace
	allLinks.forEach(link => {
		if (!routeExists(link.href)) {
			brokenLinks.push(link);
			
			// Agregar a rutas faltantes si no es externa
			if (!link.href.startsWith('http') && !link.href.startsWith('mailto:') && !link.href.startsWith('#')) {
				if (!missingRoutes.includes(link.href)) {
					missingRoutes.push(link.href);
				}
			}
		}
	});
	
	// Generar reporte
	generateReport(allLinks);
}

// Función para generar reporte
function generateReport(allLinks = []) {
	console.log('\n📊 REPORTE DE AUDITORÍA DE ENLACES');
	console.log('=' .repeat(50));
	
	if (brokenLinks.length === 0) {
		console.log('✅ ¡Todos los enlaces funcionan correctamente!');
	} else {
		console.log(`❌ Encontrados ${brokenLinks.length} enlaces problemáticos:`);
		console.log('\n🔴 ENLACES ROTOS:');
		
		brokenLinks.forEach((link, index) => {
			console.log(`${index + 1}. ${link.type}: "${link.href}"`);
			console.log(`   📁 Archivo: ${link.file}`);
			console.log('');
		});
		
		if (missingRoutes.length > 0) {
			console.log('\n📝 RUTAS FALTANTES QUE NECESITAN IMPLEMENTACIÓN:');
			missingRoutes.forEach((route, index) => {
				console.log(`${index + 1}. ${route}`);
			});
		}
	}
	
	console.log('\n📋 RUTAS EXISTENTES:');
	existingRoutes.forEach(route => {
		console.log(`✓ ${route}`);
	});
	
	// Guardar reporte en archivo
	const reportData = {
		timestamp: new Date().toISOString(),
		totalLinks: allLinks.length,
		brokenLinks,
		missingRoutes,
		existingRoutes
	};
	
	fs.writeFileSync('link-audit-report.json', JSON.stringify(reportData, null, 2));
	console.log('\n💾 Reporte guardado en: link-audit-report.json');
}

// Ejecutar auditoría
if (require.main === module) {
	auditLinks();
}

module.exports = { auditLinks, extractLinksFromFile, routeExists };