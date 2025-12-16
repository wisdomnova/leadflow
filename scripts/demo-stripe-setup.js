#!/usr/bin/env node

/**
 * Demo Stripe Setup for Development
 * 
 * This script shows the demo Stripe product/price IDs being used for development
 * with the Trial plan. Update these values when you have real Stripe products.
 */

const demoStripeSetup = {
  products: {
    Trial: {
      description: 'Get started with Leadflow for free',
      productId: 'prod_trial_demo_001',
      priceId: null,
      price: 0,
      interval: null,
      features: ['Up to 100 contacts', 'Basic email templates', 'Limited campaigns', 'Email support'],
    },
    Starter: {
      description: 'Perfect for individual sales professionals',
      productId: 'prod_starter_demo_002',
      priceId: 'price_starter_demo_002',
      price: '$29/month',
      interval: 'month',
      features: [
        '1 user, unlimited sending domains',
        '10,000 emails/month',
        'Unlimited AI generator & personalization',
        'AI subject lines & follow-up suggestions',
        'Central inbox (Unibox)',
        'Advanced analytics dashboard',
        'Email & chat support',
      ],
    },
    Growth: {
      description: 'Best for growing sales teams',
      productId: 'prod_growth_demo_003',
      priceId: 'price_growth_demo_003',
      price: '$99/month',
      interval: 'month',
      features: [
        '3 users, unlimited sending domains',
        '100,000 emails/month',
        'Unlimited AI generator & personalization',
        'AI subject lines & follow-up suggestions',
        'Central inbox (Unibox)',
        'Advanced analytics dashboard',
        'Priority support (chat + email)',
      ],
    },
    Pro: {
      description: 'Enterprise-grade solution',
      productId: 'prod_pro_demo_004',
      priceId: 'price_pro_demo_004',
      price: '$299/month',
      interval: 'month',
      features: [
        'Unlimited users & sending domains',
        'Unlimited emails/month',
        'Unlimited AI generator & personalization',
        'Advanced segmentation & automation',
        'Team collaboration & workflows',
        'Full analytics & reporting',
        'API access for integrations',
        'Dedicated account manager',
        'Priority 24/7 support',
        'Custom integrations',
      ],
    },
  },
};

console.log('');
console.log('🎯 LEADFLOW DEMO STRIPE SETUP');
console.log('═'.repeat(60));
console.log('');
console.log('📋 Development Mode: Using Trial Plan');
console.log('');
console.log('These are demo product IDs for development. They will not');
console.log('work with real Stripe API calls. When ready for production:');
console.log('');
console.log('1. Create real Stripe products at: https://dashboard.stripe.com/products');
console.log('2. Replace demo IDs with actual product/price IDs');
console.log('3. Update /lib/plans.ts with real IDs');
console.log('4. Execute migration: /database/004_stripe_products.sql');
console.log('');
console.log('═'.repeat(60));
console.log('');

for (const [planName, details] of Object.entries(demoStripeSetup.products)) {
  console.log(`📦 ${planName}`);
  console.log(`   Description: ${details.description}`);
  console.log(`   Product ID: ${details.productId}`);
  if (details.priceId) {
    console.log(`   Price ID: ${details.priceId}`);
  }
  console.log(`   Price: ${details.price}`);
  console.log(`   Features:`);
  details.features.forEach((feature) => {
    console.log(`     • ${feature}`);
  });
  console.log('');
}

console.log('═'.repeat(60));
console.log('🔧 NEXT STEPS');
console.log('═'.repeat(60));
console.log('');
console.log('1. ✅ Run the database migration:');
console.log('   Copy and paste /database/004_stripe_products.sql in Supabase SQL editor');
console.log('');
console.log('2. ✅ Demo plans are already configured in /lib/plans.ts');
console.log('');
console.log('3. 🧪 Test signup with trial plan (default)');
console.log('   - Go to http://localhost:3000/signup');
console.log('   - Select "Trial" plan');
console.log('   - Complete signup');
console.log('');
console.log('4. 🔐 When ready for production:');
console.log('   - Create real Stripe products');
console.log('   - Run: node scripts/create-stripe-products.js');
console.log('   - Update environment variables with real Stripe keys');
console.log('');
console.log('═'.repeat(60));
console.log('');
