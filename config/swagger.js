import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🎫 Billetterie API - Online Reservation & Ticketing System',
      version: '1.0.0',
      description: `
# 🚀 Service BDD - Billetterie en Ligne

API complète pour la gestion de réservations et billetterie en ligne.

## 🔑 Authentification
Toutes les routes protégées nécessitent un token JWT dans l'en-tête Authorization:
\`\`\`
Authorization: Bearer <votre_token_jwt>
\`\`\`

## 🎭 Rôles Utilisateurs
- **Client**: Peut voir ses billets, faire des réservations, transférer des billets
- **Organisateur**: Peut gérer ses événements et types de billets, valider les billets
- **Administrateur**: Accès complet à toutes les fonctionnalités

## 🚦 Rate Limiting
- Routes générales: 100 req/15min
- Authentification: 20 req/15min  
- Réservations: 30 req/15min
- Paiements: 10 req/15min

## 📊 Codes de Statut
- **200**: Succès
- **201**: Ressource créée
- **400**: Erreur de validation
- **401**: Non authentifié
- **403**: Non autorisé
- **404**: Ressource non trouvée
- **429**: Rate limit dépassé
- **500**: Erreur serveur
      `,
      contact: {
        name: 'Yasser Seryas',
        email: 'yasser.seryas@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement'
      },
      {
        url: 'https://api.billetterie.com',
        description: 'Serveur de production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d0' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            phoneNumber: { type: 'string', example: '+33123456789' },
            role: { type: 'string', enum: ['client', 'organisateur', 'administrateur'], example: 'client' },
            isVerified: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Event: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d0' },
            name: { type: 'string', example: 'Concert de Jazz' },
            description: { type: 'string', example: 'Un magnifique concert de jazz en plein air' },
            category: { 
              type: 'string', 
              enum: ['concert', 'théâtre', 'sport', 'conférence', 'festival', 'autre'],
              example: 'concert'
            },
            startDate: { type: 'string', format: 'date-time', example: '2025-07-15T20:00:00Z' },
            endDate: { type: 'string', format: 'date-time', example: '2025-07-15T23:00:00Z' },
            location: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Parc de la Villette' },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string', example: '211 Avenue Jean Jaurès' },
                    city: { type: 'string', example: 'Paris' },
                    postalCode: { type: 'string', example: '75019' },
                    country: { type: 'string', example: 'France' }
                  }
                }
              }
            },
            organizer: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d0' },
            totalCapacity: { type: 'number', example: 500 },
            remainingCapacity: { type: 'number', example: 350 },
            status: { 
              type: 'string', 
              enum: ['brouillon', 'publié', 'annulé', 'complet', 'terminé'],
              example: 'publié'
            },
            ticketTypes: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['64f7a1b2c3d4e5f6a7b8c9d1', '64f7a1b2c3d4e5f6a7b8c9d2']
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        TicketType: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d0' },
            event: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d1' },
            name: { type: 'string', example: 'VIP Gold' },
            description: { type: 'string', example: 'Accès premium avec backstage' },
            price: { type: 'number', example: 150 },
            currency: { type: 'string', example: 'EUR' },
            quantity: { type: 'number', example: 50 },
            initialQuantity: { type: 'number', example: 100 },
            maxPerPurchase: { type: 'number', example: 5 },
            isAvailable: { type: 'boolean', example: true },
            saleStartDate: { type: 'string', format: 'date-time' },
            saleEndDate: { type: 'string', format: 'date-time' },
            isOnSale: { type: 'boolean', example: true },
            soldOut: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Ticket: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d0' },
            ticketNumber: { type: 'string', example: 'A1B2C3D4' },
            event: { 
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string', example: 'Concert de Jazz' },
                startDate: { type: 'string', format: 'date-time' },
                location: { type: 'object' }
              }
            },
            ticketType: {
              type: 'object', 
              properties: {
                _id: { type: 'string' },
                name: { type: 'string', example: 'VIP Gold' },
                price: { type: 'number', example: 150 }
              }
            },
            owner: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                firstName: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                email: { type: 'string', example: 'john@example.com' }
              }
            },
            reservation: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d1' },
            price: { type: 'number', example: 150 },
            currency: { type: 'string', example: 'EUR' },
            qrCode: { type: 'string', example: 'data:image/png;base64,iVBOR...' },
            isUsed: { type: 'boolean', example: false },
            usedAt: { type: 'string', format: 'date-time', nullable: true },
            isTransferable: { type: 'boolean', example: true },
            transferHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  fromUser: { type: 'string' },
                  toUser: { type: 'string' },
                  transferDate: { type: 'string', format: 'date-time' }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Reservation: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d0' },
            reservationNumber: { type: 'string', example: 'R-12345678-9012' },
            user: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d1' },
            event: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string', example: 'Concert de Jazz' },
                startDate: { type: 'string', format: 'date-time' },
                location: { type: 'object' }
              }
            },
            tickets: {
              type: 'array',
              items: { type: 'string' },
              example: ['64f7a1b2c3d4e5f6a7b8c9d2', '64f7a1b2c3d4e5f6a7b8c9d3']
            },
            totalAmount: { type: 'number', example: 300 },
            currency: { type: 'string', example: 'EUR' },
            status: { 
              type: 'string',
              enum: ['en attente', 'confirmée', 'annulée', 'remboursée'],
              example: 'confirmée'
            },
            payment: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d4' },
            promoCode: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'SUMMER2025' },
                discountAmount: { type: 'number', example: 50 },
                discountPercentage: { type: 'number', example: 10 }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d0' },
            reservation: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d1' },
            amount: { type: 'number', example: 300 },
            currency: { type: 'string', example: 'EUR' },
            paymentMethod: { 
              type: 'string',
              enum: ['carte_credit', 'paypal', 'virement', 'especes', 'autre'],
              example: 'carte_credit'
            },
            status: {
              type: 'string',
              enum: ['en attente', 'traitement', 'complété', 'échoué', 'remboursé', 'annulé'],
              example: 'complété'
            },
            transactionId: { type: 'string', example: 'txn_1234567890' },
            paymentDate: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d0' },
            type: { type: 'string', enum: ['email', 'sms', 'push'], example: 'email' },
            recipient: { type: 'string', example: 'user@example.com' },
            subject: { type: 'string', example: 'Confirmation de réservation' },
            content: { type: 'string', example: 'Votre réservation a été confirmée' },
            template: { type: 'string', example: 'reservation_confirmation' },
            status: { 
              type: 'string',
              enum: ['pending', 'sent', 'failed', 'delivered'],
              example: 'sent'
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'urgent'],
              example: 'normal'
            },
            scheduledFor: { type: 'string', format: 'date-time' },
            sentAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Opération réussie' },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Erreur de validation' },
            error: { type: 'string', example: 'Le champ email est requis' }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Données invalides' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Email invalide' }
                }
              }
            }
          }
        }
      },
      parameters: {
        AuthHeader: {
          name: 'Authorization',
          in: 'header',
          description: 'Token JWT Bearer',
          required: true,
          schema: {
            type: 'string',
            example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          }
        },
        EventId: {
          name: 'eventId',
          in: 'path',
          description: 'ID de l\'événement',
          required: true,
          schema: {
            type: 'string',
            example: '64f7a1b2c3d4e5f6a7b8c9d0'
          }
        },
        TicketId: {
          name: 'id',
          in: 'path',
          description: 'ID du billet',
          required: true,
          schema: {
            type: 'string',
            example: '64f7a1b2c3d4e5f6a7b8c9d0'
          }
        },
        TicketTypeId: {
          name: 'id',
          in: 'path',
          description: 'ID du type de billet',
          required: true,
          schema: {
            type: 'string',
            example: '64f7a1b2c3d4e5f6a7b8c9d0'
          }
        },
        ReservationId: {
          name: 'id',
          in: 'path',
          description: 'ID de la réservation',
          required: true,
          schema: {
            type: 'string',
            example: '64f7a1b2c3d4e5f6a7b8c9d0'
          }
        },
        PaymentId: {
          name: 'id',
          in: 'path',
          description: 'ID du paiement',
          required: true,
          schema: {
            type: 'string',
            example: '64f7a1b2c3d4e5f6a7b8c9d0'
          }
        }
      },
      responses: {
        Success: {
          description: 'Opération réussie',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' }
            }
          }
        },
        Created: {
          description: 'Ressource créée avec succès',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' }
            }
          }
        },
        BadRequest: {
          description: 'Erreur de validation des données',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' }
            }
          }
        },
        Unauthorized: {
          description: 'Token manquant ou invalide',
          content: {
            'application/json': {
              schema: { 
                $ref: '#/components/schemas/ErrorResponse',
                example: {
                  success: false,
                  message: 'Not authorized, no token'
                }
              }
            }
          }
        },
        Forbidden: {
          description: 'Permissions insuffisantes',
          content: {
            'application/json': {
              schema: { 
                $ref: '#/components/schemas/ErrorResponse',
                example: {
                  success: false,
                  message: 'User role client is not authorized to access this route'
                }
              }
            }
          }
        },
        NotFound: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: { 
                $ref: '#/components/schemas/ErrorResponse',
                example: {
                  success: false,
                  message: 'Ressource non trouvée'
                }
              }
            }
          }
        },
        TooManyRequests: {
          description: 'Rate limit dépassé',
          content: {
            'application/json': {
              schema: { 
                $ref: '#/components/schemas/ErrorResponse',
                example: {
                  success: false,
                  message: 'Too many requests, please try again later.'
                }
              }
            }
          }
        },
        InternalServerError: {
          description: 'Erreur interne du serveur',
          content: {
            'application/json': {
              schema: { 
                $ref: '#/components/schemas/ErrorResponse',
                example: {
                  success: false,
                  message: 'Internal Server Error'
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: '🏥 Monitoring et santé du service'
      },
      {
        name: 'Authentication',
        description: '🔐 Gestion des utilisateurs et authentification'
      },
      {
        name: 'Events',
        description: '🎪 Gestion des événements'
      },
      {
        name: 'TicketTypes',
        description: '🎫 Gestion des types de billets'
      },
      {
        name: 'Tickets',
        description: '🎟️ Gestion des billets individuels'
      },
      {
        name: 'Reservations',
        description: '📋 Gestion des réservations'
      },
      {
        name: 'Payments',
        description: '💳 Gestion des paiements'
      },
      {
        name: 'Notifications',
        description: '📢 Système de notifications'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };