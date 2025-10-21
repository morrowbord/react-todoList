// src/services/telegramService.js
const TELEGRAM_BOT_TOKEN = process.env.REACT_APP_TELEGRAM_BOT_TOKEN;

class TelegramService {
  constructor() {
    if (!TELEGRAM_BOT_TOKEN) {
      console.warn('Telegram bot token is not configured. Notifications will be disabled.');
    }
    this.botToken = TELEGRAM_BOT_TOKEN;
    this.isEnabled = !!TELEGRAM_BOT_TOKEN;
  }

  async sendMessage(chatId, message) {
    if (!this.isEnabled) {
      console.log('Telegram notifications disabled - no bot token configured');
      return false;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        }
      );

      const result = await response.json();
      
      if (!result.ok) {
        console.error('Error sending Telegram message:', result);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Network error sending Telegram message:', error);
      return false;
    }
  }

  validateToken() {
    if (!this.botToken) {
      return false;
    }

    // Simple validation: check if it follows the basic format (numeric:alphanumeric)
    const tokenPattern = /^\d+:[A-Za-z0-9_-]+$/;
    return tokenPattern.test(this.botToken);
  }
}

export default new TelegramService();