export const API_KEY = process.env.API_KEY_EXAMPLES;

if (!process.env.AZURE_BASE_URL) {
	throw new Error(
		'AZURE_BASE_URL is required. Create a .env file in the examples/ directory with AZURE_BASE_URL=https://your-resource.cognitiveservices.azure.com',
	);
}

if (!process.env.AZURE_API_KEY) {
	throw new Error(
		'AZURE_API_KEY is required. Create a .env file in the examples/ directory with AZURE_API_KEY=your-api-key',
	);
}

if (!process.env.AZURE_DEPLOYMENT_ID) {
	throw new Error(
		'AZURE_DEPLOYMENT_ID is required. Create a .env file in the examples/ directory with AZURE_DEPLOYMENT_ID=your-deployment-id',
	);
}

if (!process.env.AZURE_API_VERSION) {
	throw new Error(
		'AZURE_API_VERSION is required. Create a .env file in the examples/ directory with AZURE_API_VERSION=2024-12-01-preview',
	);
}

export const AZURE_BASE_URL = process.env.AZURE_BASE_URL;
export const AZURE_API_KEY = process.env.AZURE_API_KEY;
export const AZURE_DEPLOYMENT_ID = process.env.AZURE_DEPLOYMENT_ID;
export const AZURE_API_VERSION = process.env.AZURE_API_VERSION;
