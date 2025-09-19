/**
 * Mock for AdvancedValidator
 */

export class AdvancedValidator {
	constructor(userId?: string, logSecurity = true) {
		// Mock constructor
	}

	validateString(input: unknown, options: any = {}) {
		return {
			success: true,
			data: typeof input === 'string' ? input : String(input || ''),
			securityIssues: [],
			sanitized: false
		}
	}

	validateEmail(input: unknown) {
		const email = String(input || '')
		const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
		return {
			success: isValid,
			data: isValid ? email : undefined,
			error: isValid ? undefined : 'Invalid email format'
		}
	}

	validatePassword(input: unknown) {
		const password = String(input || '')
		const isValid = password.length >= 8
		return {
			success: isValid,
			data: isValid ? password : undefined,
			error: isValid ? undefined : 'Password must be at least 8 characters'
		}
	}

	validateFile(file: File, options: any = {}) {
		return {
			success: true,
			data: file
		}
	}

	validateJSON(input: unknown, schema: any) {
		return {
			success: true,
			data: input
		}
	}
}

export function createValidator(userId?: string): AdvancedValidator {
	return new AdvancedValidator(userId)
}

export function validateRequestBody(body: unknown, schema: any, userId?: string) {
	return {
		success: true,
		data: body
	}
}

export function validateFields(fields: Record<string, unknown>, validations: Record<string, any>) {
	return {
		success: true,
		data: fields
	}
}

export const commonValidations = {
	email: (validator: AdvancedValidator) => (value: unknown) => validator.validateEmail(value),
	password: (validator: AdvancedValidator) => (value: unknown) => validator.validatePassword(value),
	name: (validator: AdvancedValidator) => (value: unknown) => validator.validateString(value),
	description: (validator: AdvancedValidator) => (value: unknown) => validator.validateString(value),
	url: (validator: AdvancedValidator) => (value: unknown) => validator.validateString(value)
}