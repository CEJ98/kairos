const nextJest = require('next/jest')

const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files
	dir: './'
})

// Add any custom config to be passed to Jest
const customJestConfig = {
	setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.js'],
	testEnvironment: 'jest-environment-jsdom',
	testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^@/components/(.*)$': '<rootDir>/src/components/$1',
		'^@/lib/(.*)$': '<rootDir>/src/lib/$1',
		'^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
		'^@/stores/(.*)$': '<rootDir>/src/stores/$1',
		'^@/types/(.*)$': '<rootDir>/src/types/$1'
	},
	collectCoverageFrom: [
		'src/**/*.{js,jsx,ts,tsx}',
		'!src/**/*.d.ts',
		'!src/app/**/layout.tsx',
		'!src/app/**/loading.tsx',
		'!src/app/**/error.tsx',
		'!src/app/**/not-found.tsx'
	],
	testMatch: [
		'<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
		'<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}'
	]
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)