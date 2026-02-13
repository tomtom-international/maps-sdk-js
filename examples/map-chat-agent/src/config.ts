export const API_KEY = process.env.API_KEY_EXAMPLES;

if (!process.env.AZURE_RESOURCE_NAME) {
	throw new Error(
		'AZURE_RESOURCE_NAME is required. Create a .env file in the examples/ directory with AZURE_RESOURCE_NAME=your-resource-name',
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

export const AZURE_RESOURCE_NAME = process.env.AZURE_RESOURCE_NAME;
export const AZURE_API_KEY = process.env.AZURE_API_KEY;
export const AZURE_DEPLOYMENT_ID = process.env.AZURE_DEPLOYMENT_ID;
