# Learning Path Agent with Todoist Integration

This React application provides a landing page where users can input queries that are sent to a Relay app AI agent. The AI agent creates projects and todos in Todoist, which are then displayed on a dedicated results page.

## Features

- **Landing Page**: Clean, modern interface with search functionality
- **AI Agent Integration**: Sends queries to Relay app for processing
- **Todoist Integration**: Fetches and displays projects and todos created by the AI agent
- **Real-time Updates**: Shows loading states and error handling
- **Responsive Design**: Works on all device sizes

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Todoist API

To enable Todoist integration, you need to:

1. Get your Todoist API token from: https://app.todoist.com/app/settings/integrations/developer
2. Create a `.env` file in the root directory with:
```
VITE_TODOIST_API_TOKEN=your-actual-todoist-api-token
```

### 3. Start Development Server
```bash
npm run dev
```

## How It Works

1. **User Input**: User types a query on the landing page
2. **Relay App**: Query is sent to your Relay app AI agent
3. **Todoist Creation**: The AI agent creates a new project and todos in Todoist
4. **Results Display**: The app fetches the created project and todos from Todoist API
5. **Beautiful UI**: Displays the project and todos in an organized, modern interface

## API Integration

The app uses the Todoist REST API v2 to:
- Fetch the most recently created project
- Retrieve all todos within that project
- Display project details, task status, priorities, and due dates

## File Structure

- `src/App.jsx` - Main app with routing and landing page
- `src/AIAgentPage.jsx` - Results page that displays Todoist data
- `src/services/todoistService.js` - Todoist API integration
- `src/components/TodoistDisplay.jsx` - Component for displaying projects and todos

## Technologies Used

- React 19
- React Router DOM
- Vite
- Tailwind CSS
- Lucide React Icons
- Todoist REST API v2

##Screenshots
- <img width="1912" height="916" alt="image" src="https://github.com/user-attachments/assets/f125c875-20dc-4990-83cb-76b5b26e24a6" />
- <img width="1898" height="923" alt="image" src="https://github.com/user-attachments/assets/5e102600-6024-4e78-af40-dd2b6a05c311" />
- <img width="1915" height="926" alt="image" src="https://github.com/user-attachments/assets/3491ea82-d4fe-46ac-a45b-d89dcb8713b6" />
- <img width="1297" height="938" alt="image" src="https://github.com/user-attachments/assets/b049f2ab-6f6a-4382-88c9-a542a819e434" />





