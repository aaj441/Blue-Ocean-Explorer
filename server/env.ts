import { z } from "zod";

const envSchema = z.object({
  // Core Configuration
  NODE_ENV: z.enum(["development", "production", "test"]),
  BASE_URL: z.string().optional(),
  BASE_URL_OTHER_PORT: z.string().optional(),
  
  // Database
  DATABASE_URL: z.string(),
  
  // Authentication
  ADMIN_PASSWORD: z.string().min(8, "Admin password must be at least 8 characters"),
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  SESSION_SECRET: z.string().min(32, "Session secret must be at least 32 characters").optional(),
  SESSION_MAX_AGE: z.string().transform(Number).default("2592000000"), // 30 days
  
  // AI/ML Services
  OPENROUTER_API_KEY: z.string(),
  
  // Payment Processing
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  DEFAULT_COMMISSION_RATE: z.string().transform(Number).default("0.70"),
  REFERRAL_REWARD_AMOUNT: z.string().transform(Number).default("10"),
  
  // Object Storage (MinIO)
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.string().transform(Number).default("9000"),
  MINIO_USE_SSL: z.string().transform(v => v === "true").default("false"),
  MINIO_ACCESS_KEY: z.string().default("minioadmin"),
  MINIO_SECRET_KEY: z.string().default("minioadmin"),
  MINIO_BUCKET_NAME: z.string().default("blue-ocean-explorer"),
  
  // Redis Configuration
  REDIS_URL: z.string().optional(),
  
  // Email Service
  EMAIL_SERVICE: z.enum(["sendgrid", "resend", "ses", "smtp"]).optional(),
  EMAIL_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("60000"),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default("100"),
  
  // CORS
  CORS_ORIGIN: z.string().transform(v => v.split(",")).optional(),
  
  // Feature Flags
  ENABLE_MARKETPLACE: z.string().transform(v => v === "true").default("true"),
  ENABLE_AI_FEATURES: z.string().transform(v => v === "true").default("true"),
  ENABLE_BETA_FEATURES: z.string().transform(v => v === "true").default("false"),
  
  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  LOG_FORMAT: z.enum(["json", "pretty"]).default("json"),
  
  // Health Check
  HEALTH_CHECK_INTERVAL: z.string().transform(Number).default("30000"),
});

// Validate environment variables
export const env = envSchema.parse(process.env);

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;
