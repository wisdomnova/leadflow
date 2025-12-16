#!/usr/bin/env node

console.log('\n📌 STRIPE KEYS SETUP GUIDE\n');
console.log('================================\n');

console.log('1. Go to Stripe Dashboard:');
console.log('   https://dashboard.stripe.com/\n');

console.log('2. Navigate to "Developers" > "API Keys"\n');

console.log('3. You will see two sets of keys:\n');
console.log('   ✅ PUBLISHABLE KEY:');
console.log('      - Format: pk_test_... (test mode) or pk_live_... (live mode)');
console.log('      - Usage: Client-side (safe to expose)');
console.log('      - Example: pk_test_51ABC123XYZ...\n');

console.log('   ✅ SECRET KEY:');
console.log('      - Format: sk_test_... (test mode) or sk_live_... (live mode)');
console.log('      - Usage: Server-side ONLY (KEEP SECRET!)');
console.log('      - Example: sk_test_51ABC123XYZ...\n');

console.log('4. For development, use TEST KEYS (starts with pk_test_ and sk_test_)\n');

console.log('5. Add to your .env.local:\n');
console.log('   STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE');
console.log('   STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE');
console.log('   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE\n');

console.log('⚠️  IMPORTANT:');
console.log('   - NEVER commit sk_test_ or sk_live_ keys to git');
console.log('   - The NEXT_PUBLIC_ prefix means it will be exposed to client-side');
console.log('   - Only publishable keys should have NEXT_PUBLIC_ prefix');
console.log('   - Secret keys must ONLY be in .env.local (server-side only)\n');

console.log('📚 For more info:');
console.log('   https://stripe.com/docs/keys\n');
