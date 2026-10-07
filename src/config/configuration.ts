export default () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '7780', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'DEFAULT_ACCESS_SECRET_KEY_CHANGE_IN_PROD',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'DEFAULT_REFRESH_SECRET_KEY_CHANGE_IN_PROD',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    title: process.env.SWAGGER_TITLE || 'POS Enterprise API',
    description:
      process.env.SWAGGER_DESCRIPTION || 'Enterprise Point of Sale (POS) Clean Architecture API',
    version: process.env.SWAGGER_VERSION || '1.0',
    path: process.env.SWAGGER_PATH || 'docs',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
});
