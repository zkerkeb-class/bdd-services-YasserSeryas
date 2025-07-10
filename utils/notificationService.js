// utils/notificationService.js
const sendNotification = async (notificationData) => {
  try {
    const response = await fetch('http://localhost:3004/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData)
    });

    if (!response.ok) {
      throw new Error(`Erreur notification: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
    throw error;
  }
};

export default sendNotification;
