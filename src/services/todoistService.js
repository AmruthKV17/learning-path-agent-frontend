// Todoist API service
// You'll need to get your Todoist API token from https://app.todoist.com/app/settings/integrations/developer

const TODOIST_API_TOKEN = import.meta.env.VITE_TODOIST_API_TOKEN || 'your-todoist-api-token-here';
const TODOIST_API_BASE = 'https://api.todoist.com/rest/v2';

class TodoistService {
  constructor() {
    this.apiToken = TODOIST_API_TOKEN;
  }

  // Get all projects
  async getProjects() {
    try {
      const response = await fetch(`${TODOIST_API_BASE}/projects`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  // Get todos for a specific project
  async getTodosByProject(projectId) {
    try {
      const response = await fetch(`${TODOIST_API_BASE}/tasks?project_id=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch todos: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching todos:', error);
      throw error;
    }
  }

  // Get project by name
  async getProjectByName(projectName) {
    try {
      const projects = await this.getProjects();
      
      // Find project by name (case-insensitive)
      const project = projects.find(p => 
        p.name.toLowerCase().includes(projectName.toLowerCase())
      );
      
      if (!project) {
        throw new Error(`Project "${projectName}" not found`);
      }

      const todos = await this.getTodosByProject(project.id);
      
      return {
        project,
        todos
      };
    } catch (error) {
      console.error('Error getting project by name:', error);
      throw error;
    }
  }

  // Get the most recently created project (assuming the Relay app creates a new project)
  async getLatestProject() {
    try {
      const projects = await this.getProjects();
      
      // Sort by creation date (newest first)
      const sortedProjects = projects.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });

      return sortedProjects[0] || null;
    } catch (error) {
      console.error('Error getting latest project:', error);
      throw error;
    }
  }

  // Get project with todos
  async getProjectWithTodos(projectId) {
    try {
      const [project, todos] = await Promise.all([
        this.getProjects().then(projects => projects.find(p => p.id === projectId)),
        this.getTodosByProject(projectId)
      ]);

      return {
        project,
        todos
      };
    } catch (error) {
      console.error('Error getting project with todos:', error);
      throw error;
    }
  }

  // Get the latest project with its todos
  async getLatestProjectWithTodos() {
    try {
      const latestProject = await this.getLatestProject();
      
      if (!latestProject) {
        throw new Error('No projects found');
      }

      const todos = await this.getTodosByProject(latestProject.id);
      
      return {
        project: latestProject,
        todos
      };
    } catch (error) {
      console.error('Error getting latest project with todos:', error);
      throw error;
    }
  }

  // Poll for new project based on query
  async pollForNewProject(originalQuery, maxAttempts = 10) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Polling attempt ${attempt} for new project...`);
        
        const projects = await this.getProjects();
        
        // Look for a project that might match the query
        const newProject = projects.find(project => {
          const projectName = project.name.toLowerCase();
          const query = originalQuery.toLowerCase();
          
          // Check if project name contains words from the query
          const queryWords = query.split(' ').filter(word => word.length > 2);
          return queryWords.some(word => projectName.includes(word));
        });
        
        if (newProject) {
          console.log('Found matching project:', newProject.name);
          const todos = await this.getTodosByProject(newProject.id);
          return { project: newProject, todos };
        }
        
        // Wait 2 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Polling attempt ${attempt} failed:`, error);
      }
    }
    
    throw new Error('No new project found after polling');
  }

  // Update task completion using Todoist REST v2 close/reopen endpoints
  async updateTodoCompletion(todoId, completed) {
    try {
      const action = completed ? 'close' : 'reopen';
      const response = await fetch(`${TODOIST_API_BASE}/tasks/${todoId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to update todo: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  }
}

export default new TodoistService();
