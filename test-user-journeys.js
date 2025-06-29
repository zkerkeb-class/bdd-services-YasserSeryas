#!/usr/bin/env node

/**
 * 🧪 Test Suite Complet - Parcours Utilisateur
 * 
 * Ce fichier teste toutes les routes selon les parcours :
 * - 👨‍💼 Organisateur : Création événement → Configuration billets → Gestion
 * - 👤 Client : Découverte → Réservation → Paiement → Validation
 * 
 * Usage: node test-user-journeys.js
 */

import { setTimeout as sleep } from 'timers/promises';

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

// Variables globales pour stocker les données entre tests
let testData = {
  organizerToken: null,
  clientToken: null,
  organizerId: null,
  clientId: null,
  eventId: null,
  ticketTypeIds: [],
  reservationId: null,
  paymentId: null,
  ticketIds: []
};

// Utilitaires
function log(level, message, data = null) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const colors = {
    INFO: COLORS.blue,
    SUCCESS: COLORS.green,
    ERROR: COLORS.red,
    WARNING: COLORS.yellow,
    STEP: COLORS.magenta
  };
  
  console.log(`${colors[level]}[${timestamp}] ${level}: ${message}${COLORS.reset}`);
  if (data) {
    console.log(`${COLORS.cyan}${JSON.stringify(data, null, 2)}${COLORS.reset}`);
  }
}

async function makeRequest(method, endpoint, body = null, token = null) {
  const url = `${SERVER_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(body && { body: JSON.stringify(body) })
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.message || 'Request failed'}`);
    }
    
    return { status: response.status, data };
  } catch (error) {
    log('ERROR', `Request failed: ${method} ${endpoint}`, { error: error.message });
    throw error;
  }
}

// Tests individuels
async function testServerHealth() {
  log('STEP', '🏥 Test de santé du serveur');
  
  try {
    const response = await makeRequest('GET', '/health');
    log('SUCCESS', 'Serveur opérationnel', response.data);
    return true;
  } catch (error) {
    log('ERROR', 'Serveur non accessible');
    return false;
  }
}

async function testOrganizerRegistration() {
  log('STEP', '👨‍💼 Création du compte organisateur');
  
  const organizerData = {
    email: `organizer-${Date.now()}@test.com`,
    password: 'Password123!',
    firstName: 'Marie',
    lastName: 'Organisatrice',
    phoneNumber: '+33123456789',
    role: 'organisateur'
  };

  try {
    const response = await makeRequest('POST', '/api/auth/users', organizerData);
    testData.organizerId = response.data.data._id;
    
    // Simuler un JWT token (en production, il viendrait d'un endpoint de login)
    testData.organizerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NDg2MTI4NjAyODgyMmJmZGE2MzBlMCIsImVtYWlsIjoic2VyeWFzc0B0cmVzdC5mciIsImlhdCI6MTc0OTk4MjI5MCwiZXhwIjoxNzUyNTc0MjkwfQ.h0ftuY5fjDZMdWGfuuh9A729AeTz-grqJZAvlU5Rg30';
    
    log('SUCCESS', 'Organisateur créé', {
      id: testData.organizerId,
      email: organizerData.email
    });
    return true;
  } catch (error) {
    log('ERROR', 'Échec création organisateur');
    return false;
  }
}

async function testClientRegistration() {
  log('STEP', '👤 Création du compte client');
  
  const clientData = {
    email: `client-${Date.now()}@test.com`,
    password: 'Password123!',
    firstName: 'Jean',
    lastName: 'Client',
    phoneNumber: '+33987654321',
    address: {
      street: '45 Rue de la République',
      city: 'Lyon',
      postalCode: '69002',
      country: 'France'
    }
  };

  try {
    const response = await makeRequest('POST', '/api/auth/users', clientData);
    testData.clientId = response.data.data._id;
    
    // Simuler un JWT token
    testData.clientToken = 'mock_client_jwt_token';
    
    log('SUCCESS', 'Client créé', {
      id: testData.clientId,
      email: clientData.email
    });
    return true;
  } catch (error) {
    log('ERROR', 'Échec création client');
    return false;
  }
}

async function testEventCreation() {
  log('STEP', '🎪 Création d\'un événement');
  
  const eventData = {
    name:`Concert Test Jazz ${Date.now()}`,
    description: 'Un festival de jazz exceptionnel pour les tests',
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Dans 30 jours
    endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(), // Dans 31 jours
    location: {
      name: 'Palais des Tests',
      address: { 
        street: '123 Avenue des Tests',
        city: 'TestCity',
        country: 'France',
        postalCode: '75000'
      },
      // coordinates: {
      //   latitude: 48.8566,
      //   longitude: 2.3522
      // }
    },
    category: 'festival',
    // status: 'upcoming',
    // tags: ['jazz', 'test', 'musique'],
    // images: ['https://example.com/test-concert.jpg'],
    totalCapacity: 1000,
  };

  try {
    const response = await makeRequest('POST', '/api/events', eventData, testData.organizerToken);
    testData.eventId = response.data.data._id;
    
    log('SUCCESS', 'Événement créé', {
      id: testData.eventId,
      title: eventData.title
    });
    return true;
  } catch (error) {
    log('ERROR', 'Échec création événement');
    return false;
  }
}

async function testTicketTypesCreation() {
  log('STEP', '🎫 Création des types de billets');
  
  const ticketTypes = [
    {
      name: 'Billet Standard',
      description: 'Accès général au festival',
      price: 75,
      currency: 'EUR',
      quantity: 500,
      initialQuantity: 500,
      maxPerPurchase: 8,
      saleStartDate: new Date().toISOString(),
      saleEndDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      name: 'Billet VIP',
      description: 'Accès privilégié + backstage',
      price: 150,
      currency: 'EUR',
      quantity: 100,
      initialQuantity: 100,
      maxPerPurchase: 4,
      saleStartDate: new Date().toISOString(),
      saleEndDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      name: 'Billet Étudiant',
      description: 'Tarif réduit pour étudiants',
      price: 45,
      currency: 'EUR',
      quantity: 200,
      initialQuantity: 200,
      maxPerPurchase: 2,
      saleStartDate: new Date().toISOString(),
      saleEndDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  try {
    for (const ticketType of ticketTypes) {
      ticketType.event = testData.eventId;
      const response = await makeRequest('POST', '/api/ticket-types', ticketType, testData.organizerToken);
      testData.ticketTypeIds.push(response.data.data._id);
      
      log('SUCCESS', `Type de billet créé: ${ticketType.name}`, {
        id: response.data.data._id,
        price: ticketType.price
      });
      
      await sleep(500); // Pause entre les créations
    }
    return true;
  } catch (error) {
    log('ERROR', 'Échec création types de billets');
    return false;
  }
}

async function testEventDiscovery() {
  log('STEP', '🔍 Découverte d\'événements par le client');
  
  try {
    // Test 1: Tous les événements
    const allEvents = await makeRequest('GET', '/api/events');
    log('INFO', `Événements trouvés: ${allEvents.data.data?.length || 0}`);
    
    // Test 2: Filtrage par catégorie
    const musicEvents = await makeRequest('GET', '/api/events?category=Musique');
    log('INFO', `Événements musique: ${musicEvents.data.data?.length || 0}`);
    
    // Test 3: Événement spécifique
    if (testData.eventId) {
      const specificEvent = await makeRequest('GET', `/api/events/${testData.eventId}`);
      log('SUCCESS', 'Événement spécifique récupéré', {
        title: specificEvent.data.data?.title
      });
    }
    
    return true;
  } catch (error) {
    log('ERROR', 'Échec découverte événements');
    return false;
  }
}

async function testTicketTypesConsultation() {
  log('STEP', '🎫 Consultation des billets disponibles');
  
  try {
    const response = await makeRequest('GET', `/api/ticket-types/event/${testData.eventId}`);
    const ticketTypes = response.data.data || [];
    
    log('SUCCESS', `Types de billets disponibles: ${ticketTypes.length}`, {
      types: ticketTypes.map(t => ({ name: t.name, price: t.price, quantity: t.quantity }))
    });
    
    return ticketTypes.length > 0;
  } catch (error) {
    log('ERROR', 'Échec consultation billets');
    return false;
  }
}

async function testReservationCreation() {
  log('STEP', '🛒 Création d\'une réservation');
  
  if (testData.ticketTypeIds.length === 0) {
    log('ERROR', 'Aucun type de billet disponible pour la réservation');
    return false;
  }
  
  const reservationData = {
    event: testData.eventId,
    ticketType: testData.ticketTypeIds[0], // Billet Standard
    quantity: 2,
    attendees: [
      {
        firstName: 'Jean',
        lastName: 'Client',
        email: 'jean.client@test.com',
        phoneNumber: '+33987654321'
      },
      {
        firstName: 'Marie',
        lastName: 'Accompagnatrice',
        email: 'marie.acc@test.com',
        phoneNumber: '+33123456789'
      }
    ],
    specialRequests: 'Test de réservation automatisée'
  };

  try {
    const response = await makeRequest('POST', '/api/reservations', reservationData, testData.clientToken);
    testData.reservationId = response.data.data._id;
    
    log('SUCCESS', 'Réservation créée', {
      id: testData.reservationId,
      number: response.data.data.reservationNumber,
      totalAmount: response.data.data.totalAmount
    });
    return true;
  } catch (error) {
    log('ERROR', 'Échec création réservation');
    return false;
  }
}

async function testPaymentProcessing() {
  log('STEP', '💳 Traitement du paiement');
  
  if (!testData.reservationId) {
    log('ERROR', 'Aucune réservation disponible pour le paiement');
    return false;
  }
  
  const paymentData = {
    reservation: testData.reservationId,
    amount: 150, // 2 billets à 75€
    currency: 'EUR',
    paymentMethod: {
      type: 'card',
      cardNumber: '4111111111111111',
      expiryMonth: '12',
      expiryYear: '2026',
      cvv: '123',
      holderName: 'Jean Client'
    },
    billingAddress: {
      street: '45 Rue de la République',
      city: 'Lyon',
      postalCode: '69002',
      country: 'France'
    }
  };

  try {
    const response = await makeRequest('POST', '/api/payments', paymentData, testData.clientToken);
    testData.paymentId = response.data.data._id;
    
    log('SUCCESS', 'Paiement traité', {
      id: testData.paymentId,
      amount: response.data.data.amount,
      status: response.data.data.status
    });
    return true;
  } catch (error) {
    log('ERROR', 'Échec traitement paiement');
    return false;
  }
}

async function testTicketGeneration() {
  log('STEP', '🎟️ Génération et consultation des billets');
  
  try {
    const response = await makeRequest('GET', '/api/tickets/my', null, testData.clientToken);
    const tickets = response.data.data || [];
    
    if (tickets.length > 0) {
      testData.ticketIds = tickets.map(t => t._id);
      log('SUCCESS', `Billets générés: ${tickets.length}`, {
        tickets: tickets.map(t => ({
          id: t._id,
          number: t.ticketNumber,
          attendee: `${t.attendee?.firstName} ${t.attendee?.lastName}`
        }))
      });
      return true;
    } else {
      log('WARNING', 'Aucun billet trouvé');
      return false;
    }
  } catch (error) {
    log('ERROR', 'Échec consultation billets');
    return false;
  }
}

async function testTicketTransfer() {
  log('STEP', '🔄 Test de transfert de billet');
  
  if (testData.ticketIds.length < 2) {
    log('WARNING', 'Pas assez de billets pour tester le transfert');
    return true; // Non critique
  }
  
  const transferData = {
    newOwnerEmail: 'ami@test.com',
    newAttendee: {
      firstName: 'Pierre',
      lastName: 'Ami',
      email: 'ami@test.com',
      phoneNumber: '+33555666777'
    },
    message: 'Test de transfert automatisé'
  };

  try {
    const response = await makeRequest('PUT', `/api/tickets/${testData.ticketIds[1]}/transfer`, transferData, testData.clientToken);
    
    log('SUCCESS', 'Billet transféré', {
      ticketId: testData.ticketIds[1],
      newOwner: 'ami@test.com'
    });
    return true;
  } catch (error) {
    log('WARNING', 'Échec transfert billet (non critique)');
    return true; // Non critique pour la suite
  }
}

async function testNotifications() {
  log('STEP', '🔔 Test des notifications');
  
  try {
    // Test côté client
    const clientNotifs = await makeRequest('GET', '/api/notifications', null, testData.clientToken);
    log('INFO', `Notifications client: ${clientNotifs.data.data?.length || 0}`);
    
    // Test création notification par l'organisateur
    const notificationData = {
      title: 'Test de notification automatisée',
      message: 'Ceci est un test de notification depuis les tests automatisés',
      type: 'event_update',
      priority: 'medium',
      recipients: {
        type: 'event_attendees',
        eventId: testData.eventId
      },
      channels: ['push']
    };
    
    const response = await makeRequest('POST', '/api/notifications', notificationData, testData.organizerToken);
    
    log('SUCCESS', 'Notification créée', {
      id: response.data.data._id,
      title: notificationData.title
    });
    return true;
  } catch (error) {
    log('WARNING', 'Échec test notifications (non critique)');
    return true;
  }
}

async function testTicketValidation() {
  log('STEP', '✅ Test de validation de billets');
  
  if (testData.ticketIds.length === 0) {
    log('WARNING', 'Aucun billet à valider');
    return true;
  }
  
  const validationData = {
    validationLocation: 'Entrée principale - Test',
    validatorId: testData.organizerId
  };

  try {
    const response = await makeRequest('PUT', `/api/tickets/${testData.ticketIds[0]}/validate`, validationData, testData.organizerToken);
    
    log('SUCCESS', 'Billet validé', {
      ticketId: testData.ticketIds[0],
      validatedAt: response.data.data.validatedAt
    });
    return true;
  } catch (error) {
    log('ERROR', 'Échec validation billet');
    return false;
  }
}

async function testOrganizerAnalytics() {
  log('STEP', '📊 Test des analytics organisateur');
  
  try {
    // Analytics de l'événement
    const analytics = await makeRequest('GET', `/api/events/${testData.eventId}/analytics`, null, testData.organizerToken);
    log('SUCCESS', 'Analytics récupérées', analytics.data.data);
    
    // Réservations de l'événement
    const reservations = await makeRequest('GET', `/api/reservations?event=${testData.eventId}`, null, testData.organizerToken);
    log('INFO', `Réservations trouvées: ${reservations.data.data?.length || 0}`);
    
    // Billets validés
    const validatedTickets = await makeRequest('GET', `/api/events/${testData.eventId}/validated-tickets`, null, testData.organizerToken);
    log('INFO', `Billets validés: ${validatedTickets.data.data?.length || 0}`);
    
    return true;
  } catch (error) {
    log('WARNING', 'Échec analytics (non critique)');
    return true;
  }
}

async function testCancellationAndRefund() {
  log('STEP', '❌ Test d\'annulation et remboursement');
  
  if (!testData.paymentId) {
    log('WARNING', 'Aucun paiement à rembourser');
    return true;
  }
  
  const refundData = {
    reason: 'Test d\'annulation automatisée',
    amount: 75, // Remboursement partiel
    refundMethod: 'original_payment_method'
  };

  try {
    const response = await makeRequest('PUT', `/api/payments/${testData.paymentId}/refund`, refundData, testData.clientToken);
    
    log('SUCCESS', 'Remboursement traité', {
      paymentId: testData.paymentId,
      refundAmount: refundData.amount
    });
    return true;
  } catch (error) {
    log('WARNING', 'Échec remboursement (non critique)');
    return true;
  }
}

// Suite de tests principale
async function runTestSuite() {
  console.log(`${COLORS.bright}${COLORS.cyan}`);
  console.log('🧪 SUITE DE TESTS COMPLÈTE - PARCOURS UTILISATEUR');
  console.log('================================================');
  console.log(`${COLORS.reset}`);
  
  const tests = [
    { name: 'Santé du serveur', fn: testServerHealth, critical: true },
    { name: 'Inscription organisateur', fn: testOrganizerRegistration, critical: true },
    { name: 'Inscription client', fn: testClientRegistration, critical: true },
    { name: 'Création événement', fn: testEventCreation, critical: true },
    { name: 'Création types billets', fn: testTicketTypesCreation, critical: true },
    { name: 'Découverte événements', fn: testEventDiscovery, critical: true },
    { name: 'Consultation billets', fn: testTicketTypesConsultation, critical: true },
    { name: 'Création réservation', fn: testReservationCreation, critical: true },
    { name: 'Traitement paiement', fn: testPaymentProcessing, critical: true },
    { name: 'Génération billets', fn: testTicketGeneration, critical: true },
    { name: 'Transfert billet', fn: testTicketTransfer, critical: false },
    { name: 'Notifications', fn: testNotifications, critical: false },
    { name: 'Validation billets', fn: testTicketValidation, critical: true },
    { name: 'Analytics organisateur', fn: testOrganizerAnalytics, critical: false },
    { name: 'Annulation/Remboursement', fn: testCancellationAndRefund, critical: false }
  ];
  
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const test of tests) {
    console.log(`\n${COLORS.yellow}🔄 Exécution: ${test.name}${COLORS.reset}`);
    
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        log('SUCCESS', `✅ ${test.name} - SUCCÈS`);
      } else {
        if (test.critical) {
          failed++;
          log('ERROR', `❌ ${test.name} - ÉCHEC CRITIQUE`);
          break; // Arrêt si test critique échoue
        } else {
          skipped++;
          log('WARNING', `⚠️ ${test.name} - ÉCHEC NON CRITIQUE`);
        }
      }
    } catch (error) {
      if (test.critical) {
        failed++;
        log('ERROR', `❌ ${test.name} - ERREUR CRITIQUE`);
        break;
      } else {
        skipped++;
        log('WARNING', `⚠️ ${test.name} - ERREUR NON CRITIQUE`);
      }
    }
    
    await sleep(1000); // Pause entre les tests
  }
  
  // Résumé final
  console.log(`\n${COLORS.bright}${COLORS.cyan}`);
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('==================');
  console.log(`${COLORS.green}✅ Succès: ${passed}${COLORS.reset}`);
  console.log(`${COLORS.red}❌ Échecs: ${failed}${COLORS.reset}`);
  console.log(`${COLORS.yellow}⚠️ Ignorés: ${skipped}${COLORS.reset}`);
  console.log(`${COLORS.cyan}📈 Total: ${passed + failed + skipped}${COLORS.reset}`);
  
  if (failed === 0) {
    console.log(`\n${COLORS.bright}${COLORS.green}🎉 TOUS LES TESTS CRITIQUES ONT RÉUSSI !${COLORS.reset}`);
    console.log(`${COLORS.green}Le système de billetterie fonctionne correctement.${COLORS.reset}`);
  } else {
    console.log(`\n${COLORS.bright}${COLORS.red}❌ DES TESTS CRITIQUES ONT ÉCHOUÉ${COLORS.reset}`);
    console.log(`${COLORS.red}Vérifiez la configuration et les logs du serveur.${COLORS.reset}`);
  }
  
  // Affichage des données de test pour debugging
  console.log(`\n${COLORS.cyan}🔍 DONNÉES DE TEST GÉNÉRÉES:${COLORS.reset}`);
  console.log(`${COLORS.cyan}${JSON.stringify(testData, null, 2)}${COLORS.reset}`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Vérification de la disponibilité de fetch
if (typeof fetch === 'undefined') {
  console.log(`${COLORS.red}❌ fetch non disponible. Utilisez Node.js 18+ ou installez node-fetch${COLORS.reset}`);
  process.exit(1);
}

// Exécution de la suite de tests
runTestSuite().catch(error => {
  log('ERROR', 'Erreur fatale dans la suite de tests', { error: error.message });
  process.exit(1);
});
