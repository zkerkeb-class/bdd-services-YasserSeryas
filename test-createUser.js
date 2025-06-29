#!/usr/bin/env node

// Test de la fonction createUser corrigée
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SERVER_URL = 'http://localhost:3000';

// Données de test
const testUsers = [
  // Cas valide
  {
    name: "Utilisateur valide",
    data: {
      email: "test@example.com",
      password: "motdepasse123",
      firstName: "John",
      lastName: "Doe",
      phoneNumber: "+33123456789"
    },
    expectedStatus: 201
  },
  // Cas invalide - email
  {
    name: "Email invalide",
    data: {
      email: "email-invalide",
      password: "motdepasse123",
      firstName: "John",
      lastName: "Doe"
    },
    expectedStatus: 400
  },
  // Cas invalide - mot de passe trop court
  {
    name: "Mot de passe trop court",
    data: {
      email: "test2@example.com",
      password: "123",
      firstName: "Jane",
      lastName: "Doe"
    },
    expectedStatus: 400
  },
  // Cas invalide - champs manquants
  {
    name: "Champs requis manquants",
    data: {
      email: "test3@example.com",
      password: "motdepasse123"
      // firstName et lastName manquants
    },
    expectedStatus: 400
  }
];

async function testCreateUser() {
  console.log('🧪 Test de la fonction createUser corrigée\\n');
  
  for (const test of testUsers) {
    try {
      console.log(`🔍 Test: ${test.name}`);
      console.log(`📤 Données:`, JSON.stringify(test.data, null, 2));
      
      const response = await fetch(`${SERVER_URL}/api/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.data)
      });
      
      const result = await response.json();
      
      console.log(`📥 Statut: ${response.status} (attendu: ${test.expectedStatus})`);
      console.log(`📄 Réponse:`, JSON.stringify(result, null, 2));
      
      // Vérifications
      if (response.status === test.expectedStatus) {
        console.log('✅ Statut correct');
      } else {
        console.log('❌ Statut incorrect');
      }
      
      // Vérifier le format de réponse
      if (result.hasOwnProperty('success')) {
        console.log('✅ Format de réponse standardisé');
      } else {
        console.log('❌ Format de réponse non standardisé');
      }
      
      // Vérifier que le mot de passe n'est pas exposé
      if (response.status === 201 && result.data && !result.data.password) {
        console.log('✅ Mot de passe non exposé');
      } else if (response.status === 201) {
        console.log('❌ Mot de passe potentiellement exposé');
      }
      
    } catch (error) {
      console.log(`❌ Erreur lors du test: ${error.message}`);
    }
    
    console.log('\\n' + '='.repeat(50) + '\\n');
  }
  
  // Test de récupération d'utilisateur
  console.log('🔍 Test: Récupération d\'utilisateur');
  try {
    const response = await fetch(`${SERVER_URL}/api/auth/users/test@example.com`);
    const result = await response.json();
    
    console.log(`📥 Statut: ${response.status}`);
    console.log(`📄 Réponse:`, JSON.stringify(result, null, 2));
    
    if (response.status === 200 && result.data && !result.data.password) {
      console.log('✅ Utilisateur récupéré sans mot de passe');
    }
    
  } catch (error) {
    console.log(`❌ Erreur lors de la récupération: ${error.message}`);
  }
}

// Vérifier si le serveur est démarré
async function checkServer() {
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    if (response.ok) {
      console.log('✅ Serveur accessible\\n');
      return true;
    }
  } catch (error) {
    console.log("❌ Serveur non accessible. Démarrez l'application avec: npm run dev\\n");
    return false;
  }
}

async function main() {
  console.log('🚀 Test des corrections de createUser\\n');
  
  const serverReady = await checkServer();
  if (!serverReady) {
    process.exit(1);
  }
  
  await testCreateUser();
  
  console.log('🎉 Tests terminés !');
}

// Si fetch n'est pas disponible, utiliser node-fetch
if (typeof fetch === 'undefined') {
  console.log('⚠️  fetch non disponible. Installez node-fetch ou utilisez Node.js 18+');
  console.log('npm install node-fetch');
  process.exit(1);
}

main().catch(console.error);
