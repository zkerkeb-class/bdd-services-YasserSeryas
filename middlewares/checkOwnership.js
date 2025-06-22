export const checkOwnership = (Model, userField = 'user') => {
    return async (req, res, next) => {
      try {
        const resource = await Model.findById(req.params.id);
        
        if (!resource) {
          return res.status(404).json({ message: 'Ressource non trouvée' });
        }
        
        // Vérifier si l'utilisateur est propriétaire ou administrateur
        if (resource[userField].toString() !== req.user.id && req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Non autorisé' });
        }
        
        req.resource = resource; // Passer la ressource au contrôleur
        next();
      } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
      }
    };
  };