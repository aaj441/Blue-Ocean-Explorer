#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { env } from '../env';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function seed() {
  logger.info('🌱 Starting database seed...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@blueoceanexplorer.com' },
      update: {},
      create: {
        email: 'admin@blueoceanexplorer.com',
        passwordHash: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    });
    logger.info('✅ Admin user created');

    // Create demo users
    const demoPassword = await bcrypt.hash('demo123456', 10);
    const analyst = await prisma.user.upsert({
      where: { email: 'analyst@demo.com' },
      update: {},
      create: {
        email: 'analyst@demo.com',
        passwordHash: demoPassword,
        name: 'Demo Analyst',
        role: 'ANALYST',
      },
    });

    const strategist = await prisma.user.upsert({
      where: { email: 'strategist@demo.com' },
      update: {},
      create: {
        email: 'strategist@demo.com',
        passwordHash: demoPassword,
        name: 'Demo Strategist',
        role: 'STRATEGIST',
      },
    });
    logger.info('✅ Demo users created');

    // Create sample markets
    const evMarket = await prisma.market.create({
      data: {
        name: 'Electric Vehicles',
        description: 'The global electric vehicle market including cars, trucks, and charging infrastructure',
        industry: 'Automotive',
        size: 500000000000,
        growthRate: 0.25,
        userId: analyst.id,
      },
    });

    const renewableMarket = await prisma.market.create({
      data: {
        name: 'Renewable Energy',
        description: 'Solar, wind, and other renewable energy sources and technologies',
        industry: 'Energy',
        size: 1000000000000,
        growthRate: 0.15,
        userId: strategist.id,
      },
    });
    logger.info('✅ Sample markets created');

    // Create segments
    const segments = await Promise.all([
      prisma.segment.create({
        data: {
          name: 'Luxury EVs',
          description: 'High-end electric vehicles targeting premium customers',
          size: 50000000000,
          growthRate: 0.3,
          characteristics: {
            priceRange: '$80,000+',
            targetDemographic: 'High-income individuals',
            keyFeatures: ['Advanced autopilot', 'Premium materials', 'Long range'],
          },
          marketId: evMarket.id,
          userId: analyst.id,
        },
      }),
      prisma.segment.create({
        data: {
          name: 'Mass Market EVs',
          description: 'Affordable electric vehicles for mainstream consumers',
          size: 200000000000,
          growthRate: 0.35,
          characteristics: {
            priceRange: '$25,000-$50,000',
            targetDemographic: 'Middle-class families',
            keyFeatures: ['Good range', 'Safety features', 'Lower cost'],
          },
          marketId: evMarket.id,
          userId: analyst.id,
        },
      }),
    ]);
    logger.info('✅ Market segments created');

    // Create opportunities
    const opportunities = await Promise.all([
      prisma.opportunity.create({
        data: {
          title: 'EV Charging Network Expansion',
          description: 'Build comprehensive charging infrastructure in underserved areas',
          type: 'BLUE_OCEAN',
          status: 'IDENTIFIED',
          score: 0.85,
          potentialValue: 50000000,
          timeToMarket: 18,
          riskLevel: 'MEDIUM',
          marketId: evMarket.id,
          segmentId: segments[0].id,
          userId: analyst.id,
        },
      }),
      prisma.opportunity.create({
        data: {
          title: 'Battery Recycling Technology',
          description: 'Develop efficient battery recycling processes for EVs',
          type: 'INNOVATION',
          status: 'EVALUATING',
          score: 0.75,
          potentialValue: 30000000,
          timeToMarket: 24,
          riskLevel: 'HIGH',
          marketId: evMarket.id,
          userId: strategist.id,
        },
      }),
    ]);
    logger.info('✅ Opportunities created');

    // Create trends
    await Promise.all([
      prisma.trend.create({
        data: {
          name: 'Autonomous Driving',
          description: 'Self-driving technology becoming mainstream',
          category: 'Technology',
          impact: 0.9,
          timeframe: 'Long-term',
          marketId: evMarket.id,
        },
      }),
      prisma.trend.create({
        data: {
          name: 'Carbon Neutrality Goals',
          description: 'Government mandates for zero emissions',
          category: 'Political',
          impact: 0.8,
          timeframe: 'Medium-term',
          marketId: renewableMarket.id,
        },
      }),
    ]);
    logger.info('✅ Trends created');

    // Create user preferences and credit balances
    await Promise.all([
      prisma.userPreferences.create({
        data: {
          userId: analyst.id,
          theme: 'light',
          emailNotifications: true,
          weeklyDigest: true,
        },
      }),
      prisma.creditBalance.create({
        data: {
          userId: analyst.id,
          balance: 1000,
        },
      }),
      prisma.creditBalance.create({
        data: {
          userId: strategist.id,
          balance: 500,
        },
      }),
    ]);
    logger.info('✅ User preferences and credits initialized');

    logger.info('🎉 Database seeding completed successfully!');
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seed().catch((error) => {
  console.error(error);
  process.exit(1);
});