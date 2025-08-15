<img width="1913" height="915" alt="image" src="https://github.com/user-attachments/assets/ccb4d27b-b346-4590-b11a-5cf370cedaca" /># Learning Path Agent with Todoist Integration

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

## Screenshots

- Landing Page:
  
  <img width="1913" height="915" alt="image" src="https://github.com/user-attachments/assets/7372fe99-ef88-4074-aa05-c0f186953a9a" />

  
- Learing Path Scheduled by Agent:
  
  <img width="1893" height="929" alt="image" src="https://github.com/user-attachments/assets/5953d188-8639-446b-a6eb-0ba97985217d" />

  <img width="1894" height="927" alt="image" src="https://github.com/user-attachments/assets/b63bc5af-6b54-4402-a626-a4fdfc92d335" />


  
- Knowledge check Quiz:
  
  <img width="1910" height="925" alt="image" src="https://github.com/user-attachments/assets/406a66b5-bc00-4af0-90ec-36f6bf86cb9a" />

  <img width="1892" height="845" alt="image" src="https://github.com/user-attachments/assets/1593fa6f-81b6-4e68-a549-86f101570f7a" />


  
- AI Agent Workflow:
  
  <img width="1297" height="938" alt="image" src="https://github.com/user-attachments/assets/b049f2ab-6f6a-4382-88c9-a542a819e434" />





