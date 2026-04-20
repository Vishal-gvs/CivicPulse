// Mock API service for frontend testing
// This simulates backend responses when no real backend is available

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data storage (simulates database)
// All demo users and issues removed - completely clean system
let users = [];
let issues = [];

let feedbacks = [];

// Mock API functions
export const mockRegister = async (userData) => {
  await delay(1000); // Simulate network delay
  
  // Check if user already exists
  const existingUser = users.find(u => u.email === userData.email);
  if (existingUser) {
    throw new Error('User with this email already exists. Try using a different email or login with existing account.');
  }
  
  // Check citizen email domain requirement
  if (userData.role === 'citizen' && !userData.email.endsWith('@gmail.com')) {
    throw new Error('Citizen accounts must use @gmail.com email address. Please use your Gmail account.');
  }
  
  // Check admin email domain requirement
  if (userData.role === 'admin' && !userData.email.endsWith('@admin.com')) {
    throw new Error('Admin accounts must use @admin.com email domain. Please use your official admin email.');
  }
  
  // Check authority email domain requirement
  if (userData.role === 'authority' && !userData.email.endsWith('@gov.in')) {
    throw new Error('Authority accounts must use @gov.in email domain. Please use your official government email.');
  }
  
  // Create new user
  const newUser = {
    _id: Date.now().toString(),
    ...userData,
    status: userData.role === 'authority' ? 'pending' : 'active', // Authorities need approval
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  
  // Generate mock token
  const token = 'mock-jwt-token-' + Date.now();
  
  return {
    data: {
      user: newUser,
      token
    }
  };
};

export const mockLogin = async (credentials) => {
  await delay(1000);
  
  const user = users.find(u => u.email === credentials.email);
  
  if (!user) {
    throw new Error('No account found with this email address');
  }
  
  if (user.password !== credentials.password) {
    throw new Error('Incorrect password');
  }
  
  // Check if authority is approved
  if (user.role === 'authority' && user.status !== 'active') {
    if (user.status === 'pending') {
      throw new Error('Your authority account is pending approval. Please wait for admin approval.');
    } else if (user.status === 'rejected') {
      throw new Error('Your authority account has been rejected. Please contact admin.');
    }
  }
  
  const token = 'mock-jwt-token-' + Date.now();
  
  return {
    data: {
      user: {
        ...user,
        password: undefined // Don't send password back
      },
      token
    }
  };
};

export const mockGetIssues = async (userId, userRole) => {
  await delay(500);
  
  // Clean system - no demo users
  // For citizens, only return their own issues
  if (userRole === 'citizen') {
    const userIssues = issues.filter(issue => issue.reportedBy._id === userId);
    return { data: userIssues };
  }
  
  // For authorities and admins, return all issues (real user issues only)
  return { data: issues };
};

export const mockCreateIssue = async (issueData) => {
  await delay(1000);
  
  // Handle FormData (from real API) or plain object (from testing)
  let parsedData;
  if (issueData instanceof FormData) {
    const userId = issueData.get('reportedBy');
    const user = users.find(u => u._id === userId);
    
    parsedData = {
      title: issueData.get('title'),
      description: issueData.get('description'),
      category: issueData.get('category'),
      location: issueData.get('location'),
      reportedBy: {
        _id: userId,
        name: user ? user.name : 'Unknown User'
      },
      image: issueData.get('image') ? 'mock-image-url' : null
    };
  } else {
    parsedData = issueData;
  }
  
  const newIssue = {
    _id: Date.now().toString(),
    ...parsedData,
    status: 'open',
    votes: 0,
    createdAt: new Date().toISOString()
  };
  
  issues.push(newIssue);
  return { data: newIssue };
};

export const mockUpdateIssue = async (id, updateData) => {
  await delay(500);
  
  const issueIndex = issues.findIndex(i => i._id === id);
  if (issueIndex === -1) {
    throw new Error('Issue not found');
  }
  
  issues[issueIndex] = { ...issues[issueIndex], ...updateData };
  return { data: issues[issueIndex] };
};

export const mockVoteIssue = async (id) => {
  await delay(300);
  
  const issue = issues.find(i => i._id === id);
  if (!issue) {
    throw new Error('Issue not found');
  }
  
  issue.votes = (issue.votes || 0) + 1;
  return { data: issue };
};

export const mockGetFeedback = async () => {
  await delay(500);
  return { data: feedbacks };
};

export const mockCreateFeedback = async (feedbackData) => {
  await delay(800);
  
  const newFeedback = {
    _id: Date.now().toString(),
    ...feedbackData,
    createdAt: new Date().toISOString()
  };
  
  feedbacks.push(newFeedback);
  return { data: newFeedback };
};

// Admin approval functions
export const mockGetPendingAuthorities = async () => {
  await delay(500);
  const pendingAuthorities = users.filter(u => u.role === 'authority' && u.status === 'pending');
  return { data: pendingAuthorities };
};

export const mockApproveAuthority = async (userId) => {
  await delay(500);
  const userIndex = users.findIndex(u => u._id === userId);
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  users[userIndex].status = 'active';
  return { data: users[userIndex] };
};

export const mockRejectAuthority = async (userId) => {
  await delay(500);
  const userIndex = users.findIndex(u => u._id === userId);
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  users[userIndex].status = 'rejected';
  return { data: users[userIndex] };
};

export const mockGetUsers = async () => {
  await delay(500);
  return { data: users };
};

export const mockGetAnalytics = async (userId, userRole) => {
  await delay(500);
  
  // Clean system - no demo users
  // Return analytics based on real users only
  const stats = {
    totalUsers: users.length,
    totalIssues: issues.length,
    resolvedIssues: issues.filter(i => i.status === 'resolved').length,
    openIssues: issues.filter(i => i.status === 'open').length,
    inProgressIssues: issues.filter(i => i.status === 'in-progress').length
  };
  
  return { data: stats };
};

// Check if we should use mock API (when backend is not available)
export const shouldUseMockApi = () => {
  // Always use mock API for frontend testing
  return true;
};
