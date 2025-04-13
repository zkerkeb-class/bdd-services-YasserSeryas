import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from './routes/authRoutes.js';
  // Importez le modèle complet, pas le schéma
import cors from 'cors';
import morgan from 'morgan';
import eventRoutes from'./routes/eventRoutes.js'
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


// Démarrer le serveur
app.listen(PORT, () =>
  console.log(`📡 Service BDD en écoute sur le port ${PORT}`)
);
