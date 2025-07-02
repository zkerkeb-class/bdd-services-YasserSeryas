import Event from "../models/eventSchema.js";
import TicketType from "../models/ticketType.js";
import asyncHandler from "express-async-handler";

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = asyncHandler(async (req, res) => {
  // Extraire les paramètres de filtrage
  const { category, location, minPrice_gte, minPrice_lte } = req.query;
  
  // Construire l'objet de filtres pour MongoDB
  const filters = {};
  
  if (category) {
    filters.category = category;
  }
  
  if (location) {
    // Recherche dans le nom du lieu ou la ville
    filters.$or = [
      { "location.name": { $regex: location, $options: "i" } },
      { "location.address.city": { $regex: location, $options: "i" } }
    ];
  }

  // Récupérer les événements avec les filtres appliqués
  const events = await Event.find(filters).populate("organizer", "firstName lastName");

  // Pour chaque événement, récupérer le prix le moins cher disponible
  const eventsWithMinPrice = await Promise.all(
    events.map(async (event) => {
      const ticketTypes = await TicketType.find({
        event: event._id,
        isAvailable: true,
        quantity: { $gt: 0 },
      }).sort({ price: 1 });

      const eventObj = event.toObject();
      eventObj.minPrice = ticketTypes.length > 0 ? ticketTypes[0].price : null;
      eventObj.currency =
        ticketTypes.length > 0 ? ticketTypes[0].currency : "EUR";

      return eventObj;
    })
  );

  // Filtrer par prix si spécifié
  let filteredEvents = eventsWithMinPrice;
  
  if (minPrice_gte || minPrice_lte) {
    filteredEvents = eventsWithMinPrice.filter(event => {
      const price = event.minPrice;
      
      // Si l'événement n'a pas de prix (gratuit), on considère le prix comme 0
      const eventPrice = price !== null ? price : 0;
      
      let matchesMinPrice = true;
      let matchesMaxPrice = true;
      
      if (minPrice_gte) {
        matchesMinPrice = eventPrice >= parseFloat(minPrice_gte);
      }
      
      if (minPrice_lte) {
        matchesMaxPrice = eventPrice <= parseFloat(minPrice_lte);
      }
      
      return matchesMinPrice && matchesMaxPrice;
    });
  }

  res.json(filteredEvents);
});


// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate(
    "organizer",
    "firstName lastName email"
  );

  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  res.json(event);
});
// @desc    Get events created by the authenticated user
// @route   GET /api/events/my
// @access  Private/Organizer
const getMyEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ organizer: req.user.id })
    .populate("organizer", "firstName lastName email")
    .sort({ createdAt: -1 });

  // Pour chaque événement, récupérer les statistiques de base
  const eventsWithStats = await Promise.all(
    events.map(async (event) => {
      const ticketTypes = await TicketType.find({ event: event._id });
      const totalTickets = ticketTypes.reduce(
        (sum, tt) => sum + tt.initialQuantity,
        0
      );
      const soldTickets = ticketTypes.reduce(
        (sum, tt) => sum + (tt.initialQuantity - tt.quantity),
        0
      );

      const eventObj = event.toObject();
      eventObj.stats = {
        totalTickets,
        soldTickets,
        availableTickets: totalTickets - soldTickets,
        ticketTypes: ticketTypes.length,
      };

      return eventObj;
    })
  );

  res.json(eventsWithStats);
});
// @desc    Create new event
// @route   POST /api/events
// @access  Private/Organizer
const createEvent = asyncHandler(async (req, res) => {
  const event = new Event({
    ...req.body,
    organizer: req.user.id,
  });

  const createdEvent = await event.save();

  // Créer automatiquement un type de ticket "Standard" basique
  const basicTicketType = new TicketType({
    event: createdEvent._id,
    name: "Standard",
    description: "Billet d'accès standard à l'événement",
    price: req.body.defaultTicketPrice || 25, // Prix par défaut ou fourni dans la requête
    currency: req.body.currency || "EUR",
    quantity: req.body.defaultTicketQuantity || 100, // Quantité par défaut ou fournie dans la requête
    initialQuantity: req.body.defaultTicketQuantity || 100,
    maxPerPurchase: req.body.maxPerPurchase || 10,
    isAvailable: true,
    saleStartDate: req.body.saleStartDate || new Date(),
    saleEndDate: req.body.saleEndDate || createdEvent.endDate || null,
  });

  await basicTicketType.save();

  // Retourner l'événement créé avec le type de ticket basique
  const eventWithTicketType = await Event.findById(createdEvent._id).populate(
    "organizer",
    "firstName lastName"
  );
  const ticketTypes = await TicketType.find({ event: createdEvent._id });

  const response = {
    ...eventWithTicketType.toObject(),
    ticketTypes: ticketTypes,
  };

  res.status(201).json(response);
});

// @desc    Get single event with pricing information
// @route   GET /api/events/:id/pricing
// @access  Public
const getEventWithPricing = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate(
    "organizer",
    "firstName lastName email"
  );

  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  // Récupérer tous les types de billets pour cet événement
  const ticketTypes = await TicketType.find({ event: req.params.id });

  // Calculer les statistiques de prix
  const availableTicketTypes = ticketTypes.filter(
    (tt) => tt.isAvailable && tt.quantity > 0
  );
  const prices = availableTicketTypes.map((tt) => tt.price);

  let pricingInfo = {
    minPrice: null,
    maxPrice: null,
    avgPrice: null,
    currency: ticketTypes.length > 0 ? ticketTypes[0].currency : "EUR",
    totalAvailableTickets: availableTicketTypes.reduce(
      (sum, tt) => sum + tt.quantity,
      0
    ),
    ticketTypes: ticketTypes,
  };

  if (prices.length > 0) {
    pricingInfo.minPrice = Math.min(...prices);
    pricingInfo.maxPrice = Math.max(...prices);
    pricingInfo.avgPrice =
      Math.round(
        (prices.reduce((sum, price) => sum + price, 0) / prices.length) * 100
      ) / 100;
  }

  const eventObj = event.toObject();
  eventObj.pricing = pricingInfo;

  res.json(eventObj);
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Organizer
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
    res.status(401);
    throw new Error("Not authorized to update this event");
  }

  const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json(updatedEvent);
});

export {
  getEvents,
  getEvent,
  getMyEvents,
  getEventWithPricing,
  createEvent,
  updateEvent,
};
