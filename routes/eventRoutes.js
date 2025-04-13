import express from 'express'
const router = express.Router();
import { protect, authorize  } from '../middlewares/auth.js';
import  { createEventValidation }  from '../validations/eventValidation.js';
import  validate from '../middlewares/validate.js';
import {
  getEvents,
  createEvent,
  updateEvent
}from '../controllers/eventController.js';

router
  .route('/')
  .get(getEvents)
  .post(
    protect,
    authorize('organisateur','administrateur'),
    validate(createEventValidation),
    createEvent
  );

router
  .route('/:id')
  .put(
    protect,
    authorize('organisateur', 'administrateur'),
    validate(createEventValidation),
    updateEvent
  );

  export default router;
