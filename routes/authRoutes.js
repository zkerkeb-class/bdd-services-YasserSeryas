import express from "express";
import { getUserByEmail, createUser,getUserById } from "../controllers/authController.js";
import { conditionalAuthLimit } from "../middlewares/conditionalRateLimit.js";
import { cacheConfig } from "../middlewares/redisCache.js";
import { invalidateUsersCache } from "../middlewares/cacheInvalidation.js";
import validate from "../middlewares/validate.js";
import { registerValidation } from "../validations/authValidation.js";

const router = express.Router();

/**
 * @swagger
 * /api/auth/users/{email}:
 *   get:
 *     summary: Récupérer un utilisateur par email
 *     description: Permet de récupérer les informations d'un utilisateur à partir de son email
 *     tags: [Authentication]
 *     parameters:
 *       - name: email
 *         in: path
 *         required: true
 *         description: Email de l'utilisateur
 *         schema:
 *           type: string
 *           format: email
 *           example: user@example.com
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/users/:email", conditionalAuthLimit, cacheConfig.auth, getUserByEmail);
router.get("/users/by-id/:id", conditionalAuthLimit, cacheConfig.auth, getUserById);
/**
 * @swagger
 * /api/auth/users:
 *   post:
 *     summary: Créer un nouvel utilisateur
 *     description: Permet de créer un compte utilisateur avec validation des données
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: motdepasse123
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               phoneNumber:
 *                 type: string
 *                 example: "+33123456789"
 *               role:
 *                 type: string
 *                 enum: [client, organisateur, administrateur]
 *                 default: client
 *                 example: client
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Utilisateur créé avec succès
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/users", conditionalAuthLimit, invalidateUsersCache, validate(registerValidation), createUser);

export default router;
