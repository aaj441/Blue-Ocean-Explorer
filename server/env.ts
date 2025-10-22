import { z } from "zod";

const envSchema = z.object({
  // Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  DATABASE_URL_TEST: z.string().url().optional(),
  
  // Application URLs
  BASE_URL: z.string().url().optional(),
  BASE_URL_OTHER_PORT: z.string().url().optional(),
  
  // Authentication
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters long"),
  
  // AI Services
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
  
  // Payment Processing (Stripe)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Business Configuration
  DEFAULT_COMMISSION_RATE: z.string().regex(/^0\.\d{1,2}$/, "Commission rate must be between 0.00 and 0.99").default("0.70"),
  REFERRAL_REWARD_AMOUNT: z.string().regex(/^\d+(\.\d{1,2})?$/, "Referral reward must be a valid amount").default("10"),
  
  // File Storage (MinIO/S3)
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.string().regex(/^\d+$/).default("9000"),
  MINIO_ACCESS_KEY: z.string().default("minioadmin"),
  MINIO_SECRET_KEY: z.string().default("minioadmin"),
  MINIO_BUCKET_NAME: z.string().default("blue-ocean-explorer"),
  MINIO_USE_SSL: z.string().transform(val => val === "true").default("false"),
  
  // Redis (for caching and sessions)
  REDIS_URL: z.string().url().optional(),
  
  // Email Service
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/).optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  
  // Monitoring and Analytics
  SENTRY_DSN: z.string().url().optional(),
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).default("900000"), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).default("100"),
  
  // Security
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  HELMET_CSP_ENABLED: z.string().transform(val => val === "true").default("true"),
  
  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOG_FORMAT: z.enum(["json", "pretty"]).default("json"),
  
  // Feature Flags
  ENABLE_MARKETPLACE: z.string().transform(val => val === "true").default("true"),
  ENABLE_CHALLENGES: z.string().transform(val => val === "true").default("true"),
  ENABLE_AI_INSIGHTS: z.string().transform(val => val === "true").default("true"),
  ENABLE_REAL_TIME_COLLABORATION: z.string().transform(val => val === "true").default("false"),
});

// Validate environment variables
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    console.error('❌ Invalid environment variables:');
    console.error(missingVars.join('\n'));
    process.exit(1);
  }
  throw error;
}

// Additional validation for production
if (env.NODE_ENV === 'production') {
  const requiredForProduction = [
    'DATABASE_URL',
    'JWT_SECRET',
    'ADMIN_PASSWORD',
    'OPENROUTER_API_KEY',
  ];
  
  const missing = requiredForProduction.filter(key => !env[key as keyof typeof env]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables for production:');
    console.error(missing.join(', '));
    process.exit(1);
  }
  
  // Warn about optional but recommended variables
  const recommended = [
    'STRIPE_SECRET_KEY',
    'REDIS_URL',
    'SENTRY_DSN',
  ];
  
  const missingRecommended = recommended.filter(key => !env[key as keyof typeof env]);
  
  if (missingRecommended.length > 0) {
    console.warn('⚠️  Missing recommended environment variables for production:');
    console.warn(missingRecommended.join(', '));
  }
}

export { env };
