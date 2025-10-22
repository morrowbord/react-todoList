# React Todo List Application

A feature-rich Kanban-style task management application built with React and Supabase, featuring drag-and-drop functionality, task archiving, and Telegram notifications.

## Features

### Core Functionality
- **Kanban Board**: Visual task management with three columns (Задачи, В работе, Готово)
- **Drag and Drop**: Intuitive task movement between columns using dnd-kit
- **Task Management**: Create, edit, complete, and delete tasks
- **User Authentication**: Google OAuth and email/password authentication
- **Role-based Access**: Admin and regular user roles with different permissions
- **Dark/Light Theme**: Toggle between dark and light modes

### Task Management
- **Create Tasks**: Add new tasks with text, priority, assignee, and due date
- **Edit Tasks**: Modify task details including text, priority, assignee, and due date
- **Complete Tasks**: Mark tasks as completed with visual indication
- **Priorities**: Three priority levels (Срочно, Не важно, Идея) with color coding
- **Due Dates**: Set and track task deadlines with overdue indication

### Archive System
- **Archive Tasks**: Move completed or unnecessary tasks to archive
- **Archive View**: Dedicated view to see all archived tasks
- **Restore Tasks**: Bring archived tasks back to active board
- **Permanent Deletion**: Delete tasks permanently from archive
- **Admin Notes**: Add administrator notes to archived tasks

### Telegram Notifications
- **Real-time Updates**: Receive notifications for task events via Telegram
- **Configurable**: Set bot token and default chat ID via environment variables
- **Multiple Events**: Notifications for task creation, completion, archiving, and deletion
- **Secure**: Bot token stored in environment variables

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd react-todoList
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your configuration:
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_KEY=your_supabase_key
REACT_APP_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
REACT_APP_TELEGRAM_DEFAULT_CHAT_ID=your_telegram_chat_id
```

4. Start the development server:
```bash
npm start
```

## Configuration

### Supabase Setup
1. Create a Supabase project at [supabase.io](https://supabase.io)
2. Create a `tasks` table with the following columns:
   - `id` (auto-incrementing integer, primary key)
   - `text` (text)
   - `completed` (boolean)
   - `priority` (text)
   - `assignee` (text)
   - `due_date` (date)
   - `column_id` (text)
   - `created_by` (text)
   - `archived` (boolean) - for archive functionality

### Telegram Bot Setup
1. Create a bot with [BotFather](https://t.me/botfather) on Telegram
2. Get your bot token
3. Get your chat ID by sending a message to your bot and using the API:
   ```
   https://api.telegram.org/bot<your_bot_token>/getUpdates
   ```
4. Add both values to your `.env` file

## Usage

### Task Management
1. **Login**: Use Google OAuth or email/password to log in
2. **Create Tasks**: Click "Добавить" in any column to add a new task
3. **Edit Tasks**: Click "Редактировать" on any task to modify its details
4. **Move Tasks**: Drag and drop tasks between columns
5. **Complete Tasks**: Check the "Выполнено" checkbox

### Archive Functionality
1. **Archive Tasks**: Click "Архивировать" to move any task to the archive
2. **View Archive**: Click the "Архив" button in the header to view archived tasks
3. **Restore Tasks**: In the archive view, click "Восстановить" to bring tasks back
4. **Delete Permanently**: In the archive view, click "Удалить навсегда" to permanently remove tasks

### Telegram Notifications
Once configured, you'll receive notifications for:
- New task creation
- Task completion
- Task archiving
- Task deletion
- Task editing

## Project Structure

```
src/
├── App.js              # Main application component
├── App.css             # Global styles
├── services/           # Service modules
│   ├── telegramService.js
│   └── notificationService.js
└── utils/              # Utility functions
    └── userUtils.js
```

## Technologies Used

- **React**: Frontend library
- **Supabase**: Backend services (authentication, database)
- **dnd-kit**: Drag and drop functionality
- **CSS**: Styling with theme support
- **Telegram Bot API**: Notification system

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
free for personal use