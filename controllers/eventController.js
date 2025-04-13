import Event from '../models/eventSchema.js'
import asyncHandler from 'express-async-handler'


// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = asyncHandler(async (req, res) => {
  const events = await Event.find().populate('organizer', 'firstName lastName');
  res.json(events);
});

// @desc    Create new event
// @route   POST /api/events
// @access  Private/Organizer
const createEvent = asyncHandler(async (req, res) => {
  const event = new Event({
    ...req.body,
    organizer: req.user.id
  });
  
  const createdEvent = await event.save();
  res.status(201).json(createdEvent);
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Organizer
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  
  if(!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  
  if(event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Not authorized to update this event');
  }
  
  const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { 
    new: true,
    runValidators: true
  });
  
  res.json(updatedEvent);
});

export  {
  getEvents,
  createEvent,
  updateEvent
};
