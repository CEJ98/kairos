const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const basicFoods = [
	// Proteínas
	{
		name: 'Pechuga de Pollo',
		category: 'Proteínas',
		subcategory: 'Carnes',
		caloriesPer100g: 165,
		proteinPer100g: 31,
		carbsPer100g: 0,
		fatsPer100g: 3.6,
		fiberPer100g: 0,
		commonUnit: 'pieza',
		commonUnitGrams: 150,
		isVerified: true
	},
	{
		name: 'Huevo Entero',
		category: 'Proteínas',
		subcategory: 'Huevos',
		caloriesPer100g: 155,
		proteinPer100g: 13,
		carbsPer100g: 1.1,
		fatsPer100g: 11,
		fiberPer100g: 0,
		commonUnit: 'unidad',
		commonUnitGrams: 50,
		isVerified: true
	},
	{
		name: 'Salmón',
		category: 'Proteínas',
		subcategory: 'Pescados',
		caloriesPer100g: 208,
		proteinPer100g: 25,
		carbsPer100g: 0,
		fatsPer100g: 12,
		fiberPer100g: 0,
		commonUnit: 'filete',
		commonUnitGrams: 120,
		isVerified: true
	},
	{
		name: 'Atún en Agua',
		category: 'Proteínas',
		subcategory: 'Pescados',
		caloriesPer100g: 116,
		proteinPer100g: 25.5,
		carbsPer100g: 0,
		fatsPer100g: 0.8,
		fiberPer100g: 0,
		commonUnit: 'lata',
		commonUnitGrams: 80,
		isVerified: true
	},

	// Carbohidratos
	{
		name: 'Arroz Blanco Cocido',
		category: 'Carbohidratos',
		subcategory: 'Cereales',
		caloriesPer100g: 130,
		proteinPer100g: 2.7,
		carbsPer100g: 28,
		fatsPer100g: 0.3,
		fiberPer100g: 0.4,
		commonUnit: 'taza',
		commonUnitGrams: 150,
		isVerified: true
	},
	{
		name: 'Avena',
		category: 'Carbohidratos',
		subcategory: 'Cereales',
		caloriesPer100g: 389,
		proteinPer100g: 16.9,
		carbsPer100g: 66.3,
		fatsPer100g: 6.9,
		fiberPer100g: 10.6,
		commonUnit: 'taza',
		commonUnitGrams: 80,
		isVerified: true
	},
	{
		name: 'Papa Cocida',
		category: 'Carbohidratos',
		subcategory: 'Tubérculos',
		caloriesPer100g: 87,
		proteinPer100g: 1.9,
		carbsPer100g: 20,
		fatsPer100g: 0.1,
		fiberPer100g: 1.8,
		commonUnit: 'unidad mediana',
		commonUnitGrams: 150,
		isVerified: true
	},
	{
		name: 'Pan Integral',
		category: 'Carbohidratos',
		subcategory: 'Panes',
		caloriesPer100g: 247,
		proteinPer100g: 13,
		carbsPer100g: 41,
		fatsPer100g: 4.2,
		fiberPer100g: 7,
		commonUnit: 'rebanada',
		commonUnitGrams: 25,
		isVerified: true
	},

	// Grasas
	{
		name: 'Aceite de Oliva',
		category: 'Grasas',
		subcategory: 'Aceites',
		caloriesPer100g: 884,
		proteinPer100g: 0,
		carbsPer100g: 0,
		fatsPer100g: 100,
		fiberPer100g: 0,
		commonUnit: 'cucharada',
		commonUnitGrams: 15,
		isVerified: true
	},
	{
		name: 'Aguacate',
		category: 'Grasas',
		subcategory: 'Frutas',
		caloriesPer100g: 160,
		proteinPer100g: 2,
		carbsPer100g: 8.5,
		fatsPer100g: 14.7,
		fiberPer100g: 6.7,
		commonUnit: 'unidad',
		commonUnitGrams: 200,
		isVerified: true
	},
	{
		name: 'Almendras',
		category: 'Grasas',
		subcategory: 'Frutos Secos',
		caloriesPer100g: 579,
		proteinPer100g: 21.2,
		carbsPer100g: 21.6,
		fatsPer100g: 49.9,
		fiberPer100g: 12.5,
		commonUnit: 'puñado',
		commonUnitGrams: 30,
		isVerified: true
	},

	// Verduras
	{
		name: 'Brócoli',
		category: 'Verduras',
		subcategory: 'Crucíferas',
		caloriesPer100g: 34,
		proteinPer100g: 2.8,
		carbsPer100g: 7,
		fatsPer100g: 0.4,
		fiberPer100g: 2.6,
		commonUnit: 'taza',
		commonUnitGrams: 90,
		isVerified: true
	},
	{
		name: 'Espinaca',
		category: 'Verduras',
		subcategory: 'Hojas Verdes',
		caloriesPer100g: 23,
		proteinPer100g: 2.9,
		carbsPer100g: 3.6,
		fatsPer100g: 0.4,
		fiberPer100g: 2.2,
		commonUnit: 'taza',
		commonUnitGrams: 30,
		isVerified: true
	},
	{
		name: 'Tomate',
		category: 'Verduras',
		subcategory: 'Solanáceas',
		caloriesPer100g: 18,
		proteinPer100g: 0.9,
		carbsPer100g: 3.9,
		fatsPer100g: 0.2,
		fiberPer100g: 1.2,
		commonUnit: 'unidad mediana',
		commonUnitGrams: 120,
		isVerified: true
	},

	// Frutas
	{
		name: 'Plátano',
		category: 'Frutas',
		subcategory: 'Tropicales',
		caloriesPer100g: 89,
		proteinPer100g: 1.1,
		carbsPer100g: 23,
		fatsPer100g: 0.3,
		fiberPer100g: 2.6,
		commonUnit: 'unidad',
		commonUnitGrams: 120,
		isVerified: true
	},
	{
		name: 'Manzana',
		category: 'Frutas',
		subcategory: 'Pomáceas',
		caloriesPer100g: 52,
		proteinPer100g: 0.3,
		carbsPer100g: 14,
		fatsPer100g: 0.2,
		fiberPer100g: 2.4,
		commonUnit: 'unidad',
		commonUnitGrams: 150,
		isVerified: true
	},

	// Lácteos
	{
		name: 'Leche Descremada',
		category: 'Lácteos',
		subcategory: 'Leches',
		caloriesPer100g: 34,
		proteinPer100g: 3.4,
		carbsPer100g: 5,
		fatsPer100g: 0.1,
		fiberPer100g: 0,
		commonUnit: 'vaso',
		commonUnitGrams: 250,
		isVerified: true
	},
	{
		name: 'Yogur Griego Natural',
		category: 'Lácteos',
		subcategory: 'Yogures',
		caloriesPer100g: 59,
		proteinPer100g: 10,
		carbsPer100g: 3.6,
		fatsPer100g: 0.4,
		fiberPer100g: 0,
		commonUnit: 'envase',
		commonUnitGrams: 170,
		isVerified: true
	},
	{
		name: 'Queso Cottage',
		category: 'Lácteos',
		subcategory: 'Quesos',
		caloriesPer100g: 98,
		proteinPer100g: 11,
		carbsPer100g: 3.4,
		fatsPer100g: 4.3,
		fiberPer100g: 0,
		commonUnit: 'taza',
		commonUnitGrams: 100,
		isVerified: true
	}
]

async function seedNutrition() {
	console.log('🌱 Iniciando seed de alimentos básicos...')

	try {
		// Crear alimentos básicos
		for (const food of basicFoods) {
			const existingFood = await prisma.food.findFirst({
				where: { name: food.name }
			})

			if (!existingFood) {
				await prisma.food.create({
					data: food
				})
				console.log(`✅ Alimento creado: ${food.name}`)
			} else {
				console.log(`⏭️  Alimento ya existe: ${food.name}`)
			}
		}

		console.log('🎉 Seed de nutrición completado exitosamente')
		console.log(`📊 Total de alimentos en la base de datos: ${await prisma.food.count()}`)

	} catch (error) {
		console.error('❌ Error durante el seed de nutrición:', error)
		throw error
	} finally {
		await prisma.$disconnect()
	}
}

if (require.main === module) {
	seedNutrition()
		.catch((error) => {
			console.error(error)
			process.exit(1)
		})
}

module.exports = { seedNutrition }