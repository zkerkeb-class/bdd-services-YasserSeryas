// Script d'initialisation MongoDB pour l'API de billetterie

// Basculer vers la base de données billetterie
db = db.getSiblingDB('billetterie');

// Créer un utilisateur pour l'application
db.createUser({
  user: 'billetterie_user',
  pwd: 'billetterie_password',
  roles: [
    {
      role: 'readWrite',
      db: 'billetterie'
    }
  ]
});

// Créer les collections avec validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'firstName', 'lastName', 'role'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
          description: 'Email valide requis'
        },
        firstName: {
          bsonType: 'string',
          minLength: 1,
          description: 'Prénom requis'
        },
        lastName: {
          bsonType: 'string',
          minLength: 1,
          description: 'Nom requis'
        },
        role: {
          bsonType: 'string',
          enum: ['client', 'organisateur', 'administrateur'],
          description: 'Rôle valide requis'
        }
      }
    }
  }
});

db.createCollection('events', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'description', 'startDate', 'location', 'totalCapacity', 'organizer'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          description: 'Nom de l\'événement requis'
        },
        startDate: {
          bsonType: 'date',
          description: 'Date de début requise'
        },
        totalCapacity: {
          bsonType: 'int',
          minimum: 1,
          description: 'Capacité totale positive requise'
        }
      }
    }
  }
});

db.createCollection('reservations');
db.createCollection('tickets');
db.createCollection('ticketTypes');
db.createCollection('payments');
db.createCollection('notifications');

// Créer les index pour optimiser les performances

// Index pour les utilisateurs
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// Index pour les événements
db.events.createIndex({ organizer: 1 });
db.events.createIndex({ startDate: 1 });
db.events.createIndex({ category: 1 });
db.events.createIndex({ status: 1 });
db.events.createIndex({ "location.city": 1 });

// Index pour les réservations
db.reservations.createIndex({ user: 1 });
db.reservations.createIndex({ event: 1 });
db.reservations.createIndex({ status: 1 });
db.reservations.createIndex({ createdAt: 1 });

// Index pour les billets
db.tickets.createIndex({ user: 1 });
db.tickets.createIndex({ event: 1 });
db.tickets.createIndex({ ticketType: 1 });
db.tickets.createIndex({ qrCode: 1 }, { unique: true });
db.tickets.createIndex({ status: 1 });

// Index pour les types de billets
db.ticketTypes.createIndex({ event: 1 });
db.ticketTypes.createIndex({ event: 1, name: 1 }, { unique: true });

// Index pour les paiements
db.payments.createIndex({ user: 1 });
db.payments.createIndex({ reservation: 1 });
db.payments.createIndex({ status: 1 });
db.payments.createIndex({ createdAt: 1 });

// Index pour les notifications
db.notifications.createIndex({ recipient: 1 });
db.notifications.createIndex({ type: 1 });
db.notifications.createIndex({ status: 1 });
db.notifications.createIndex({ createdAt: 1 });

// Créer un utilisateur administrateur par défaut
db.users.insertOne({
  email: 'admin@billetterie.com',
  password: '$2b$10$example.hash.here', // Hash du mot de passe 'admin123'
  firstName: 'Admin',
  lastName: 'System',
  role: 'administrateur',
  phoneNumber: '+33123456789',
  createdAt: new Date(),
  updatedAt: new Date()
});

print('✅ Base de données billetterie initialisée avec succès');
print('📊 Collections créées avec validation');
print('🚀 Index de performance appliqués');
print('👤 Utilisateur administrateur créé');
print('🔐 Utilisateur applicatif créé');
