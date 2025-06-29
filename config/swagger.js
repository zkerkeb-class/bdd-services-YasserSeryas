import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Billetterie API - Online Reservation & Ticketing System',
      version: '1.0.0',
      description: 'API complète pour la gestion de réservations et billetterie en ligne.',
      contact: {
        name: 'Yasser Seryas',
        email: 'yasser.seryas@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement'
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
            role: { type: 'string', enum: ['client', 'organisateur', 'administrateur'], example: 'client' }
          }
        },
        Event: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d0' },
            title: { type: 'string', example: 'Concert de Jazz' },
            description: { type: 'string', example: 'Un magnifique concert de jazz' },
            startDate: { type: 'string', format: 'date-time', example: '2025-07-15T20:00:00Z' },
            location: {
              type: 'object',
              properties: {
                address: { type: 'string', example: '123 rue de la Paix' },
                city: { type: 'string', example: 'Paris' },
                country: { type: 'string', example: 'France' }
              }
            },
            totalCapacity: { type: 'number', example: 500 },
            minPrice: { type: 'number', example: 25.0 },
            currency: { type: 'string', example: 'EUR' }
          }
        },
        TicketType: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d0' },
            event: { type: 'string', example: '64f7a1b2c3d4e5f6a7b8c9d1' },
            name: { type: 'string', example: 'Standard' },
            description: { type: 'string', example: 'Billet standard' },
            price: { type: 'number', example: 25 },
            currency: { type: 'string', example: 'EUR' },
            quantity: { type: 'number', example: 100 },
            isAvailable: { type: 'boolean', example: true }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Erreur' },
            error: { type: 'string', example: 'Détails de l\'erreur' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Succès' },
            data: { type: 'object', description: 'Données retournées' }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Données invalides',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        Unauthorized: {
          description: 'Non authentifié',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        Forbidden: {
          description: 'Accès interdit',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFound: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        TooManyRequests: {
          description: 'Trop de requêtes',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        InternalServerError: {
          description: 'Erreur interne du serveur',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  apis: []
};

let specs;

try {
  specs = swaggerJsdoc(options);
  console.log('✅ Configuration Swagger chargée avec succès');
} catch (error) {
  console.error('❌ Erreur lors du chargement de Swagger:', error.message);
  console.error('📍 Stack:', error.stack);
  
  // Configuration minimale de fallback
  specs = {
    openapi: '3.0.0',
    info: {
      title: 'Billetterie API - Mode Minimal',
      version: '1.0.0',
      description: 'API en mode minimal suite à une erreur de configuration'
    },
    paths: {},
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Erreur' }
          }
        }
      }
    }
  };
}

export { specs, swaggerUi };