import 'dotenv/config';
import { Redis } from '@upstash/redis';

async function testRedisConnection() {
  try {
    console.log('🔍 Testing Redis connection...');

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Test 1: Ping
    console.log('1️⃣ Testing PING...');
    const pong = await redis.ping();
    console.log('   ✅ PONG:', pong);

    // Test 2: Set a value
    console.log('2️⃣ Testing SET...');
    await redis.set('test:connection', 'Kairos Redis works!');
    console.log('   ✅ Value set');

    // Test 3: Get the value
    console.log('3️⃣ Testing GET...');
    const value = await redis.get('test:connection');
    console.log('   ✅ Value retrieved:', value);

    // Test 4: Delete the value
    console.log('4️⃣ Testing DEL...');
    await redis.del('test:connection');
    console.log('   ✅ Value deleted');

    console.log('\n🎉 Redis connection successful!\n');
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    return false;
  }
}

testRedisConnection();