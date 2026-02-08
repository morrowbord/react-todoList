# React Todo List Application with SQLite Backend

A feature-rich Kanban-style task management application built with React and SQLite, featuring drag-and-drop functionality, task archiving, and Telegram notifications.

## Features

### Core Functionality
- **Kanban Board**: Visual task management with three columns (Задачи, В работе, Готово)
- **Drag and Drop**: Intuitive task movement between columns using dnd-kit
- **Task Management**: Create, edit, complete, and delete tasks
- **User Authentication**: Email/password authentication with role-based access
- **Role-based Access**: Admin and regular user roles with different permissions
- **Dark/Light Theme**: Toggle between dark and light modes

### Task Management
- **Create Tasks**: Add new tasks with text, priority, assignee, and due date
- **Edit Tasks**: Modify task details including text, priority, assignee, and due date
- **Complete Tasks**: Mark tasks as completed with visual indication
- **Priorities**: Three priority levels (Срочно, Проект, Идея) with color coding
- **Due Dates**: Set and track task deadlines with overdue indication

### Archive System
- **Archive Tasks**: Move completed or unnecessary tasks to archive
- **Archive View**: Dedicated view to see all archived tasks
- **Restore Tasks**: Bring archived tasks back to active board
- **Permanent Deletion**: Delete tasks permanently from archive

### Authentication System
- **JWT Tokens**: Secure authentication using JSON Web Tokens
- **Protected Routes**: All task-related routes require valid authentication
- **Role-based Permissions**: Different access rights for admin and regular users
- **Secure Token Verification**: Middleware to validate tokens on each request

### Telegram Notifications
- **Real-time Updates**: Receive notifications for task events via Telegram
- **Configurable**: Set bot token and default chat ID via environment variables
- **Multiple Events**: Notifications for task creation, completion, archiving, and deletion

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
# Server configuration
PORT=5000
JWT_SECRET=very_strong_secret_key_that_should_be_at_least_32_characters_long_for_security

# Telegram configuration
REACT_APP_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
REACT_APP_TELEGRAM_DEFAULT_CHAT_ID=your_telegram_chat_id

# API configuration
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

## Database Schema

The application uses SQLite with the following tables:

### Users Table
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `email` (TEXT UNIQUE NOT NULL)
- `password_hash` (TEXT)
- `role` (TEXT DEFAULT 'user')
- `telegram_id` (TEXT)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### Tasks Table
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `text` (TEXT NOT NULL)
- `completed` (BOOLEAN DEFAULT 0)
- `priority` (TEXT DEFAULT 'idea')
- `assignee` (TEXT)
- `due_date` (TEXT)
- `column_id` (TEXT DEFAULT 'todo')
- `created_by` (INTEGER, FOREIGN KEY REFERENCES users(id))
- `archived` (BOOLEAN DEFAULT 0)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

## Usage

### Task Management
1. **Login**: Use registered email and password to log in
2. **Create Tasks**: Click "Добавить" in any column to add a new task
3. **Edit Tasks**: Click "Редактировать" on any task to modify its details
4. **Move Tasks**: Drag and drop tasks between columns
5. **Complete Tasks**: Check the "Выполнено" checkbox

### Archive Functionality
1. **Archive Tasks**: Click "Архивировать" to move any task to the archive
2. **View Archive**: Click the "Архив" button in the header to view archived tasks
3. **Restore Tasks**: In the archive view, click "Восстановить" to bring tasks back
4. **Delete Permanently**: In the archive view, click "Удалить навсегда" to permanently remove tasks

### Authentication and Authorization
- The application uses JWT tokens for authentication
- Tokens are stored in browser's localStorage
- Protected routes require valid JWT tokens in Authorization header
- Admin users can manage all tasks, regular users can only manage their own tasks

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
│   └── notificationService.js
├── utils/              # Utility functions
│   └── userUtils.js
middleware/
└── auth.js             # Authentication middleware
routes/
├── auth.js             # Authentication routes
└── tasks.js            # Task-related routes
.env                    # Environment variables
server.js               # Main server entry point
database.db             # SQLite database file
```

## Technologies Used

- **React**: Frontend library
- **Express.js**: Backend framework
- **SQLite**: Database engine
- **dnd-kit**: Drag and drop functionality
- **CSS**: Styling with theme support
- **JWT**: Authentication mechanism
- **Telegram Bot API**: Notification system

## Security Considerations

- JWT tokens are signed with a secret key stored in environment variables
- Protected routes require valid authentication tokens
- Role-based access controls prevent unauthorized task modifications
- Passwords are hashed before storage (using bcrypt)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
Free for personal use