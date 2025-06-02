import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from 'cors';
import morgan from 'morgan';
import eventRoutes from'./routes/eventRoutes.js'
import authRoutes from './routes/authRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000;
const MONGO_URI = process.env.MONGO_URI;
app.use(cors());
app.use(morgan('dev'));
// Connexion à MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connexion à MongoDB réussie"))
  .catch((err) => console.error("❌ Erreur de connexion à MongoDB:", err));

app.use(express.json());


// Route test
app.get("/", (req, res) => {
  res.send("Service BDD opérationnel avec MongoDB ✅");
});

// Route pour récupérer un utilisateur
app.use('/', authRoutes);
// route events
app.use('/events',eventRoutes);
// route reservation
app.use('/reservation',reservationRoutes)
// Route pour gérer les paiements
 app.use('/payments', paymentRoutes);
// route notification
app.use('/api/notifications', notificationRoutes);
// Démarrer le serveur
app.listen(PORT, () =>
  console.log(`📡 Service BDD en écoute sur le port ${PORT}`)
);
