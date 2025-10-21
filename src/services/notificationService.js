// src/services/notificationService.js
import telegramService from './telegramService';

class NotificationService {
  constructor() {
    this.telegramService = telegramService;
  }

  // Format task information for notifications
  formatTaskMessage = (task, action) => {
    const priorityLabels = {
      urgent: 'Срочно',
      notImportant: 'Не важно',
      idea: 'Идея'
    };
    
    const priorityLabel = priorityLabels[task.priority] || 'Идея';
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('ru-RU') : 'не указан';
    
    let message = '';
    
    switch (action) {
      case 'create':
        message = `📋 <b>Новая задача создана!</b>\n`;
        message += `Задача: ${task.text}\n`;
        message += `Приоритет: ${priorityLabel}\n`;
        message += `Срок: ${dueDate}\n`;
        if (task.assignee) message += `Назначена: ${task.assignee}`;
        break;
        
      case 'complete':
        message = `✅ <b>Задача выполнена!</b>\n`;
        message += `Задача: ${task.text}\n`;
        if (task.assignee) message += `Исполнитель: ${task.assignee}\n`;
        message += `Дата выполнения: ${new Date().toLocaleDateString('ru-RU')}\n`;
        message += `Отличная работа! 🎉`;
        break;
        
      case 'archive':
        message = `📦 <b>Задача архивирована</b>\n`;
        message += `Задача: ${task.text}\n`;
        message += `Статус выполнения: ${task.completed ? 'Выполнена' : 'Не выполнена'}`;
        break;
        
      case 'delete':
        message = `🗑️ <b>Задача удалена навсегда</b>\n`;
        message += `Задача: ${task.text}`;
        break;
        
      case 'edit':
        message = `✏️ <b>Задача обновлена</b>\n`;
        message += `Задача: ${task.text}\n`;
        message += `Приоритет: ${priorityLabel}\n`;
        message += `Срок: ${dueDate}\n`;
        if (task.assignee) message += `Назначена: ${task.assignee}`;
        break;
        
      case 'assign':
        message = `👤 <b>Вам назначена задача!</b>\n`;
        message += `Задача: ${task.text}\n`;
        message += `Приоритет: ${priorityLabel}\n`;
        message += `Срок: ${dueDate}`;
        break;
        
      default:
        message = `ℹ️ <b>Обновление задачи</b>\n`;
        message += `Задача: ${task.text}`;
    }
    
    return message;
  }

  // Send notification to a specific user
  sendToUser = async (chatId, task, action, senderName = null) => {
    if (!chatId) {
      console.log('No chat ID provided, skipping notification');
      return false;
    }
    
    const message = this.formatTaskMessage(task, action);
    return await this.telegramService.sendMessage(chatId, message);
  }

  // Send notification to multiple users
  sendToMultiple = async (chatIds, task, action) => {
    const results = await Promise.allSettled(
      chatIds.map(chatId => this.sendToUser(chatId, task, action))
    );
    
    const successfulSends = results.filter(result => result.status === 'fulfilled' && result.value).length;
    const totalSends = chatIds.length;
    
    console.log(`Sent ${successfulSends} out of ${totalSends} notifications successfully`);
    
    return {
      successful: successfulSends,
      total: totalSends,
      failed: totalSends - successfulSends
    };
  }

  // Send notification to all relevant users for a task
  sendTaskNotification = async (task, action, currentUser, allUsers = []) => {
    // Check for a default chat ID in environment variables
    const defaultChatId = process.env.REACT_APP_TELEGRAM_DEFAULT_CHAT_ID;
    if (defaultChatId) {
      // Send to default chat ID if configured
      const success = await this.sendToUser(defaultChatId, task, action);
      return { successful: success ? 1 : 0, total: 1, failed: success ? 0 : 1 };
    }
    
    // For now, we'll send to all users as an example
    // In a real implementation, you'd have logic to determine who should receive notifications
    const relevantUserIds = this.getRelevantUsersForTask(task, action, allUsers);
    
    if (relevantUserIds.length > 0) {
      return await this.sendToMultiple(relevantUserIds, task, action);
    }
    
    return { successful: 0, total: 0, failed: 0 };
  }

  // Determine which users should receive notifications for a task
  getRelevantUsersForTask = (task, action, allUsers) => {
    // This would typically check a user profile table for Telegram chat IDs
    // For now, returning empty array as placeholder
    // In a real implementation, this would query your user profiles table
    return [];
  }

  // Specific notification methods for different actions
  notifyTaskCreated = async (task, creator, allUsers) => {
    return await this.sendTaskNotification(task, 'create', creator, allUsers);
  }

  notifyTaskCompleted = async (task, completer, allUsers) => {
    return await this.sendTaskNotification(task, 'complete', completer, allUsers);
  }

  notifyTaskArchived = async (task, archiver, allUsers) => {
    return await this.sendTaskNotification(task, 'archive', archiver, allUsers);
  }

  notifyTaskDeleted = async (task, deleter, allUsers) => {
    return await this.sendTaskNotification(task, 'delete', deleter, allUsers);
  }

  notifyTaskEdited = async (task, editor, allUsers) => {
    return await this.sendTaskNotification(task, 'edit', editor, allUsers);
  }

  notifyTaskAssigned = async (task, assigner, allUsers) => {
    return await this.sendTaskNotification(task, 'assign', assigner, allUsers);
  }
}

export default new NotificationService();