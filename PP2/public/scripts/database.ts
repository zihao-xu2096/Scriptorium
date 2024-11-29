/**
 * Utility functions for making API requests related to users
 */

interface User {
    id?: number;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    userType?: string;
    avatar?: string;
    phoneNumber?: string;
  }
  
  interface Template {
    id?: number;
    title?: string;
    explanation?: string;
    language?: string;
    code?: string;
    authorId?: number;
    tags?: string[];
  }
  
  /**
   * Get a user by ID, email, or authenticate with email and password
   * @param {Object} params
   * @param {string} [params.email] - User's email
   * @param {number} [params.id] - User's ID
   * @param {string} [params.password] - User's password (for authentication)
   * @returns {Promise<Object>} User data
   * @example
   * Get by ID
   * getUser({ id: 1 })
   * 
   * Get by email
   * getUser({ email: "test@example.com" })
   * 
   * Authenticate with email and password
   * getUser({ email: "test@example.com", password: "password123" })
   */
  async function getUser({ email, id, password }: { email?: string; id?: number; password?: string } = {}): Promise<User> {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (id) params.append('id', id.toString());
    if (password) params.append('password', password);
    
    const response = await fetch(`/api/User?${params}`);
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user');
    }
    
    return response.json();
  }
  
  /**
  * Create a new user
  * @param {Object} userData
  * @param {string} userData.email
  * @param {string} userData.password
  * @param {string} userData.firstName
  * @param {string} userData.lastName
  * @returns {Promise<Object>} Created user data
  * @example
  * createUser({
  *   email: "user@example.com",
  *   password: "securepass",
  *   firstName: "John",
  *   lastName: "Doe"
  * })
  */
  async function createUser(userData: User): Promise<User> {
      const response = await fetch('/api/User', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
          const error = await response.json();
          throw { message: error.error, details: error.user };
      }
      
      return response.json();
  }
  
  /**
  * Update a user
  * @param {number} id - User ID
  * @param {Object} updateData - Data to update
  * @param {string} [updateData.email]
  * @param {string} [updateData.password]
  * @param {string} [updateData.firstName]
  * @param {string} [updateData.lastName]
  * @param {string} [updateData.userType]
  * @param {string} [updateData.avatar]
  * @param {string} [updateData.phoneNumber]
  * @returns {Promise<Object>} Updated user data
  * @example
  * updateUser(1, {
  *   email: "newemail@example.com",
  *   firstName: "NewName"
  * })
  */
  async function updateUser(id: number, updateData: User): Promise<User> {
    const response = await fetch(`/api/User/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
    }
    
    return response.json();
  }
  
  /**
  * Delete a user and their associated templates
  * @param {number} id - User ID
  * @returns {Promise<Object>} Deletion confirmation
  */
  async function deleteUser(id: number): Promise<{ message: string }> {
    const response = await fetch(`/api/User/${id}`, {
        method: 'DELETE',
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
    }
    
    return response.json();
  }
  
  /**
   * Get templates with optional filtering
   * @param {Object} params
   * @param {number} [params.id] - Template ID
   * @param {number} [params.authorId] - Author's ID
   * @param {string} [params.language] - Programming language
   * @param {string} [params.tag] - Tag to filter by
   * @returns {Promise<Object[]>} Array of template data   
   * @returns {Promise<Object>} Deletion confirmation
   * @example
   * Get by author
   * getTemplates({ authorId: 123 })
   * Get by language
   * getTemplates({ language: "javascript" })
   */
  async function getTemplates({ id, authorId, language, tag }: { id?: number; authorId?: number; language?: string; tag?: string } = {}): Promise<Template[]> {
    const params = new URLSearchParams();
    if (id) params.append('id', id.toString());
    if (authorId) params.append('authorId', authorId.toString());
    if (language) params.append('language', language);
    if (tag) params.append('tag', tag);
    
    const response = await fetch(`/api/template?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch templates');
    }
    
    return response.json();
  }
  
  /**
   * Create a new template
   * @param {Object} templateData
   * @param {string} templateData.title
   * @param {string} templateData.explanation
   * @param {string} templateData.language
   * @param {string} templateData.code
   * @param {number} templateData.authorId
   * @param {string[]} [templateData.tags]
   * @returns {Promise<Object>} Created template data
   * @example
   * createTemplate({
   *   title: "Array Sort",
   *   explanation: "Sorting array example",
   *   language: "javascript",
   *   code: "array.sort((a,b) => a-b)",
   *   authorId: 123,
   *   tags: ["arrays", "sorting"]
   * })
   */
  async function createTemplate(templateData: Template): Promise<Template> {
    const response = await fetch('/api/template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create template');
    }
    
    return response.json();
  }
  
  /**
   * Update a template
   * @param {number} id - Template ID
   * @param {Object} updateData
   * @param {string} [updateData.title]
   * @param {string} [updateData.explanation]
   * @param {string} [updateData.language]
   * @param {string} [updateData.code]
   * @returns {Promise<Object>} Updated template data
   */
  async function updateTemplate(id: number, updateData: Template): Promise<Template> {
    const response = await fetch(`/api/template/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update template');
    }
    
    return response.json();
  }
  
  /**
   * Delete a template
   * @param {number} id - Template ID
   * @returns {Promise<void>}
   */
  async function deleteTemplate(id: number): Promise<void> {
    const response = await fetch(`/api/template/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete template');
    }
  }
  
  export {
    createTemplate, createUser, deleteTemplate, deleteUser,
    getTemplates, getUser, updateTemplate, updateUser
};
