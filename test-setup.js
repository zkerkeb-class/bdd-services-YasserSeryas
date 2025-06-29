#!/usr/bin/env node

/**
 * 🔧 Configuration et Préparation des Tests
 * 
 * Ce script prépare l'environnement pour les tests automatisés :
 * - Vérification des prérequis
 * - Nettoyage de la base de données test
 * - Configuration des variables d'environnement
 * - Lancement optionnel de la suite de tests
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const execAsync = promisify(exec);
const SERVER_URL = 'http://localhost:3000';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(level, message) {
  const colors = {
    INFO: COLORS.blue,
    SUCCESS: COLORS.green,
    ERROR: COLORS.red,
    WARNING: COLORS.yellow,
    STEP: COLORS.magenta
  };
  
  console.log(`${colors[level]}${level}: ${message}${COLORS.reset}`);
}

async function checkNodeVersion() {
  log('STEP', '🔍 Vérification de la version Node.js');
  
  try {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    const majorVersion = parseInt(version.substring(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      log('SUCCESS', `Node.js ${version} - Compatible ✅`);
      return true;
    } else {
      log('ERROR', `Node.js ${version} - Version 18+ requise ❌`);
      return false;
    }
  } catch (error) {
    log('ERROR', 'Node.js non trouvé');
    return false;
  }
}

async function checkServerStatus() {
  log('STEP', '🏥 Vérification du statut du serveur');
  
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    if (response.ok) {
      log('SUCCESS', 'Serveur accessible ✅');
      return true;
    } else {
      log('ERROR', `Serveur inaccessible (${response.status}) ❌`);
      return false;
    }
  } catch (error) {
    log('ERROR', 'Serveur non accessible ❌');
    return false;
  }
}

async function checkDependencies() {
  log('STEP', '📦 Vérification des dépendances');
  
  try {
    // Vérifier package.json
    if (!existsSync('package.json')) {
      log('ERROR', 'package.json non trouvé');
      return false;
    }
    
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const requiredDeps = [
      'express',
      'mongoose',
      'redis',
      'swagger-jsdoc',
      'swagger-ui-express'
    ];
    
    const missing = requiredDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );
    
    if (missing.length > 0) {
      log('ERROR', `Dépendances manquantes: ${missing.join(', ')}`);
      return false;
    }
    
    log('SUCCESS', 'Toutes les dépendances sont présentes ✅');
    return true;
  } catch (error) {
    log('ERROR', 'Erreur lors de la vérification des dépendances');
    return false;
  }
}

async function checkDatabaseConnections() {
  log('STEP', '🗄️ Vérification des connexions base de données');
  
  let mongoOk = false;
  let redisOk = false;
  
  // Test MongoDB
  try {
    await execAsync('mongosh --eval "db.runCommand({ping: 1})" --quiet');
    log('SUCCESS', 'MongoDB accessible ✅');
    mongoOk = true;
  } catch (error) {
    log('WARNING', 'MongoDB non accessible ou non installé ⚠️');
  }
  
  // Test Redis
  try {
    await execAsync('redis-cli ping');
    log('SUCCESS', 'Redis accessible ✅');
    redisOk = true;
  } catch (error) {
    log('WARNING', 'Redis non accessible ou non installé ⚠️');
  }
  
  return { mongo: mongoOk, redis: redisOk };
}

async function createTestEnvFile() {
  log('STEP', '⚙️ Configuration de l\'environnement de test');
  
  const testEnvContent = `# Configuration de test - Générée automatiquement
NODE_ENV=test
PORT=3000

# Base de données test
MONGO_URI=mongodb://localhost:27017/billetterie_test_db
REDIS_URL=redis://localhost:6379

# JWT pour tests
JWT_SECRET=test_jwt_secret_key_for_automated_testing_only
JWT_EXPIRE=1h

# Email désactivé pour tests
EMAIL_SERVICE=disabled
EMAIL_USER=test@example.com
EMAIL_PASS=test_password

# Logs de test
LOG_LEVEL=error
`;

  try {
    writeFileSync('.env.test', testEnvContent);
    log('SUCCESS', 'Fichier .env.test créé ✅');
    return true;
  } catch (error) {
    log('ERROR', 'Impossible de créer .env.test');
    return false;
  }
}

async function cleanTestDatabase() {
  log('STEP', '🧹 Nettoyage de la base de données de test');
  
  try {
    // Supprimer la base de test si elle existe
    await execAsync('mongosh billetterie_test_db --eval "db.dropDatabase()" --quiet');
    log('SUCCESS', 'Base de données de test nettoyée ✅');
    return true;
  } catch (error) {
    log('WARNING', 'Impossible de nettoyer la base de test (peut être normal)');
    return true; // Non critique
  }
}

async function installMissingPackages() {
  log('STEP', '📥 Installation des packages manquants');
  
  try {
    // Vérifier si node_modules existe
    if (!existsSync('node_modules')) {
      log('INFO', 'Installation des dépendances...');
      await execAsync('npm install');
      log('SUCCESS', 'Dépendances installées ✅');
    } else {
      log('SUCCESS', 'Dépendances déjà installées ✅');
    }
    return true;
  } catch (error) {
    log('ERROR', 'Erreur lors de l\'installation des dépendances');
    return false;
  }
}

async function startServerIfNeeded() {
  log('STEP', '🚀 Vérification/Démarrage du serveur');
  
  const isRunning = await checkServerStatus();
  
  if (isRunning) {
    log('SUCCESS', 'Serveur déjà en cours d\'exécution ✅');
    return true;
  }
  
  log('INFO', 'Démarrage du serveur en arrière-plan...');
  
  try {
    // Démarrer le serveur en arrière-plan
    const serverProcess = exec('npm run dev', { env: { ...process.env, NODE_ENV: 'test' } });
    
    // Attendre que le serveur soit prêt
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isReady = await checkServerStatus();
      if (isReady) {
        log('SUCCESS', 'Serveur démarré avec succès ✅');
        return { success: true, process: serverProcess };
      }
    }
    
    log('ERROR', 'Timeout lors du démarrage du serveur');
    return { success: false, process: null };
  } catch (error) {
    log('ERROR', 'Erreur lors du démarrage du serveur');
    return { success: false, process: null };
  }
}

async function runTestSuite() {
  log('STEP', '🧪 Lancement de la suite de tests');
  
  try {
    await execAsync('node test-user-journeys.js');
    log('SUCCESS', 'Suite de tests terminée avec succès ✅');
    return true;
  } catch (error) {
    log('ERROR', 'Échec de la suite de tests ❌');
    return false;
  }
}

async function main() {
  console.log(`${COLORS.bright}${COLORS.cyan}`);
  console.log('🔧 CONFIGURATION ET PRÉPARATION DES TESTS');
  console.log('==========================================');
  console.log(`${COLORS.reset}\n`);
  
  const checks = [
    { name: 'Version Node.js', fn: checkNodeVersion, critical: true },
    { name: 'Installation dépendances', fn: installMissingPackages, critical: true },
    { name: 'Vérification dépendances', fn: checkDependencies, critical: true },
    { name: 'Connexions base de données', fn: checkDatabaseConnections, critical: false },
    { name: 'Fichier environnement test', fn: createTestEnvFile, critical: true },
    { name: 'Nettoyage base test', fn: cleanTestDatabase, critical: false }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      if (!result && check.critical) {
        allPassed = false;
        log('ERROR', `❌ Échec critique: ${check.name}`);
        break;
      }
    } catch (error) {
      if (check.critical) {
        allPassed = false;
        log('ERROR', `❌ Erreur critique: ${check.name}`);
        break;
      } else {
        log('WARNING', `⚠️ Échec non critique: ${check.name}`);
      }
    }
  }
  
  if (!allPassed) {
    console.log(`\n${COLORS.red}❌ Préparation échouée. Vérifiez les erreurs ci-dessus.${COLORS.reset}`);
    process.exit(1);
  }
  
  // Démarrage du serveur si nécessaire
  const serverStatus = await startServerIfNeeded();
  
  if (!serverStatus.success) {
    console.log(`\n${COLORS.red}❌ Impossible de démarrer le serveur.${COLORS.reset}`);
    process.exit(1);
  }
  
  console.log(`\n${COLORS.green}✅ PRÉPARATION TERMINÉE AVEC SUCCÈS${COLORS.reset}`);
  console.log(`${COLORS.cyan}🚀 Prêt pour les tests automatisés !${COLORS.reset}\n`);
  
  // Demander si on lance les tests
  const args = process.argv.slice(2);
  if (args.includes('--run-tests')) {
    console.log(`${COLORS.yellow}🧪 Lancement automatique des tests...${COLORS.reset}\n`);
    await runTestSuite();
  } else {
    console.log(`${COLORS.blue}💡 Pour lancer les tests maintenant:${COLORS.reset}`);
    console.log(`${COLORS.cyan}   node test-user-journeys.js${COLORS.reset}\n`);
    console.log(`${COLORS.blue}💡 Ou relancer avec les tests automatiques:${COLORS.reset}`);
    console.log(`${COLORS.cyan}   node test-setup.js --run-tests${COLORS.reset}\n`);
  }
}

// Vérification de fetch
if (typeof fetch === 'undefined') {
  console.log(`${COLORS.red}❌ fetch non disponible. Node.js 18+ requis.${COLORS.reset}`);
  process.exit(1);
}

main().catch(error => {
  console.error(`${COLORS.red}❌ Erreur fatale: ${error.message}${COLORS.reset}`);
  process.exit(1);
});
