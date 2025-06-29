#!/usr/bin/env node

// Test rapide de la configuration Redis et Rate Limiters
import { connectRedis } from './config/redis.js';
import { initializeRateLimiters } from './middlewares/rateLimiter.js';

async function testRedisRateLimiters() {
  try {
    console.log('🧪 Test de la configuration Redis et Rate Limiters...');
    
    // Test de connexion Redis
    console.log('📡 Connexion à Redis...');
    const redisClient = await connectRedis();
    console.log('✅ Redis connecté avec succès');
    
    // Test d'initialisation des rate limiters
    console.log('⚡ Initialisation des rate limiters...');
    initializeRateLimiters(redisClient);
    console.log('✅ Rate limiters initialisés avec succès');
    
    // Fermer la connexion
    await redisClient.quit();
    console.log('🔌 Connexion Redis fermée');
    
    console.log('🎉 Tous les tests sont passés !');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testRedisRateLimiters();
