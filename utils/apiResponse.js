export const ApiResponse = {
    success: (res, data, message = 'Succès', statusCode = 200) => {
      res.status(statusCode).json({
        success: true,
        message,
        data
      });
    },
    
    error: (res, message, statusCode = 500, error = null) => {
      const response = {
        success: false,
        message
      };
      
      if (process.env.NODE_ENV === 'development' && error) {
        response.error = error.message;
        response.stack = error.stack;
      }
      
      res.status(statusCode).json(response);
    },
    
    validation: (res, errors) => {
      res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors
      });
    }
  };