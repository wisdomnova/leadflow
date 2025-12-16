#!/usr/bin/env node

/**
 * Script to create Stripe products and prices for Leadflow plans
 * Run this after obtaining your Stripe secret key
 * 
 * Usage: STRIPE_SECRET_KEY=sk_test_xxx node scripts/create-stripe-products.js
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const plans = [
  {
    name: 'Trial',
    description: 'Get started with Leadflow for free',
    price: 0,
    interval: null, // Free plan, no billing interval
    features: ['Up to 100 contacts', 'Basic email templates', 'Limited campaigns'],
  },
  {
    name: 'Starter',
    description: 'Perfect for small teams',
    price: 2900, // $29.00 in cents
    interval: 'month',
    features: ['Up to 5,000 contacts', 'Advanced email templates', 'Unlimited campaigns', 'Basic analytics'],
  },
  {
    name: 'Growth',
    description: 'For growing businesses',
    price: 9900, // $99.00 in cents
    interval: 'month',
    features: ['Up to 25,000 contacts', 'Custom email templates', 'Advanced segmentation', 'Full analytics', 'API access'],
  },
  {
    name: 'Pro',
    description: 'Enterprise-grade solution',
    price: 29900, // $299.00 in cents
    interval: 'month',
    features: ['Unlimited contacts', 'Custom branding', 'Team collaboration', 'Advanced automation', 'Dedicated support', 'Custom integrations'],
  },
];

async function createProducts() {
  console.log('🚀 Creating Stripe products and prices...\n');

  const results = {
    products: {},
    errors: [],
  };

  for (const plan of plans) {
    try {
      console.log(`📦 Creating product: ${plan.name}`);

      // Create product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          leadflow_plan: plan.name.toLowerCase(),
        },
      });

      results.products[plan.name] = {
        productId: product.id,
        prices: [],
      };

      // Create price if not free tier
      if (plan.price > 0 && plan.interval) {
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.price,
          currency: 'usd',
          recurring: {
            interval: plan.interval,
            interval_count: 1,
          },
          metadata: {
            plan_name: plan.name,
            features: JSON.stringify(plan.features),
          },
        });

        results.products[plan.name].prices.push({
          priceId: price.id,
          amount: plan.price,
          interval: plan.interval,
        });

        console.log(`  ✅ Product created: ${product.id}`);
        console.log(`  ✅ Price created: ${price.id} ($${(plan.price / 100).toFixed(2)}/${plan.interval})`);
      } else {
        console.log(`  ✅ Product created: ${product.id} (Free tier - no billing)`);
      }

      console.log('');
    } catch (error) {
      const errorMsg = `❌ Error creating ${plan.name}: ${error.message}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
      console.log('');
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  for (const [planName, data] of Object.entries(results.products)) {
    console.log(`\n${planName}:`);
    console.log(`  Product ID: ${data.productId}`);
    if (data.prices.length > 0) {
      data.prices.forEach((price) => {
        console.log(`  Price ID: ${price.priceId} ($${(price.amount / 100).toFixed(2)}/${price.interval})`);
      });
    } else {
      console.log('  Price: Free (no billing)');
    }
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  ERRORS ENCOUNTERED:');
    results.errors.forEach((error) => console.log(`  ${error}`));
  }

  console.log('\n' + '='.repeat(60));
  console.log('💡 NEXT STEPS:');
  console.log('='.repeat(60));
  console.log('1. Update your database with these Stripe product/price IDs');
  console.log('2. Update the PLANS in /lib/plans.ts with the priceIds');
  console.log('3. Test the signup flow to verify plan selection works');
  console.log('\nSample update for /lib/plans.ts:');
  console.log(JSON.stringify(results.products, null, 2));
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY environment variable is not set');
  console.error('\nUsage: STRIPE_SECRET_KEY=sk_test_xxx node scripts/create-stripe-products.js');
  process.exit(1);
}

createProducts().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
