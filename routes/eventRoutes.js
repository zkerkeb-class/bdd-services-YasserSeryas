import express from 'express'
const router = express.Router();
import { protect, authorize  } from '../middlewares/auth.js';
import  { createEventValidation }  from '../validations/eventValidation.js';
import  validate from '../middlewares/validate.js';
import { conditionalEventReadLimit, conditionalEventCreateLimit } from '../middlewares/conditionalRateLimit.js';
import {
  getEvents,
  createEvent,
  updateEvent
}from '../controllers/eventController.js';

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Récupérer tous les événements
 *     description: Liste de tous les événements publics avec informations de l'organisateur
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Liste des événements récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   post:
 *     summary: Créer un nouvel événement
 *     description: Permet aux organisateurs et administrateurs de créer un événement
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - category
 *               - startDate
 *               - endDate
 *               - location
 *               - totalCapacity
 *             properties:
 *               name:
 *                 type: string
 *                 example: Concert de Jazz
 *               description:
 *                 type: string
 *                 example: Un magnifique concert de jazz en plein air
 *               category:
 *                 type: string
 *                 enum: [concert, théâtre, sport, conférence, festival, autre]
 *                 example: concert
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-07-15T20:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-07-15T23:00:00Z"
 *               location:
 *                 type: object
 *                 required:
 *                   - name
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: Parc de la Villette
 *                   address:
 *                     type: object
 *                     properties:
 *                       street:
 *                         type: string
 *                         example: 211 Avenue Jean Jaurès
 *                       city:
 *                         type: string
 *                         example: Paris
 *                       postalCode:
 *                         type: string
 *                         example: "75019"
 *                       country:
 *                         type: string
 *                         example: France
 *               totalCapacity:
 *                 type: number
 *                 minimum: 1
 *                 example: 500
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["jazz", "musique", "plein-air"]
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router
  .route('/')
  .get(conditionalEventReadLimit, getEvents)
  .post(
    conditionalEventCreateLimit,
    protect,
    authorize('organisateur','administrateur'),
    validate(createEventValidation),
    createEvent
  );

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Modifier un événement
 *     description: Permet aux organisateurs et administrateurs de modifier un événement existant
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de l'événement à modifier
 *         schema:
 *           type: string
 *           example: 64f7a1b2c3d4e5f6a7b8c9d0
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Concert de Jazz Modifié
 *               description:
 *                 type: string
 *                 example: Description mise à jour
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: object
 *               totalCapacity:
 *                 type: number
 *                 minimum: 1
 *               status:
 *                 type: string
 *                 enum: [brouillon, publié, annulé, complet, terminé]
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router
  .route('/:id')
  .put(
    protect,
    authorize('organisateur', 'administrateur'),
    validate(createEventValidation),
    updateEvent
  );

export default router;
