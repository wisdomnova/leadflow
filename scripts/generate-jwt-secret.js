#!/usr/bin/env node

const crypto = require('crypto');

// Generate a strong random JWT secret
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('\n✅ Generated JWT Secret:\n');
console.log(jwtSecret);
console.log('\n📋 Add this to your .env.local file:\n');
console.log(`JWT_SECRET=${jwtSecret}\n`);
console.log('⚠️  Keep this secret secure and never commit it to version control!\n');
