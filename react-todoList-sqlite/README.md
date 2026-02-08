# React Todo List with SQLite Backend

A feature-rich Kanban-style task management application built with React and SQLite, featuring drag-and-drop functionality, task archiving, and Telegram notifications.

## Features

### Core Functionality
- **Kanban Board**: Visual task management with three columns (Задачи, В работе, Готово)
- **Drag and Drop**: Intuitive task movement between columns using dnd-kit
- **Task Management**: Create, edit, complete, and delete tasks
- **User Authentication**: Email/password authentication
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
cd react-todoList-sqlite
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your configuration:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
REACT_APP_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
REACT_APP_TELEGRAM_DEFAULT_CHAT_ID=your_default_chat_id
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

## Usage

### Task Management
1. **Login**: Use email/password to log in (admin@example.com/admin123 for admin account)
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

## Technologies Used

- **React**: Frontend library
- **Node.js**: Runtime environment
- **Express**: Backend framework
- **SQLite**: Database engine
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