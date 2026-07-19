import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const LOCAL_DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
];

type Environment = NodeJS.ProcessEnv;

function isProduction(environment: Environment): boolean {
  return (
    environment.NODE_ENV === 'production' || environment.ENVIRONMENT === 'prod'
  );
}

export function parseAllowedCorsOrigins(
  origins = process.env.CORS_ALLOWED_ORIGINS,
): string[] {
  return (origins ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getAllowedCorsOrigins(
  environment: Environment = process.env,
): string[] {
  const configuredOrigins = parseAllowedCorsOrigins(
    environment.CORS_ALLOWED_ORIGINS,
  );

  if (configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  if (isProduction(environment)) {
    throw new Error('CORS_ALLOWED_ORIGINS must be set in production');
  }

  return LOCAL_DEVELOPMENT_ORIGINS;
}

export function createCorsOptions(
  environment: Environment = process.env,
): CorsOptions {
  const allowedOrigins = getAllowedCorsOrigins(environment);

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'), false);
    },
    credentials: false,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-device-token'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  };
}
