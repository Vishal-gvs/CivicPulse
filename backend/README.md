# Civic Issue Tracker Backend

A comprehensive backend API for the Civic Issue Tracker application built with Node.js, Express.js, and MongoDB.

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Citizen, Manager, Admin)
- Email domain validation (@gmail.com, @manager.com, @admin.com)
- Manager approval workflow
- Password hashing with bcrypt

### 👥 User Management
- Multi-role user system
- Admin approval for manager accounts
- User profile management
- Account status tracking (active, pending, rejected)

### 📋 Issue Management
- Issue reporting with file uploads
- Issue status tracking (open, in-progress, resolved)
- Issue categorization and priority
- Voting system for issues
- Comments and discussions
- Assignment to managers

### 📊 Analytics & Reporting
- Comprehensive system analytics
- User-specific statistics
- Issue resolution metrics
- Feedback analysis
- Performance tracking

### 💬 Feedback System
- Multi-category feedback collection
- Rating system (1-5 stars)
- Admin review and response
- Anonymous feedback option

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Express Validator** - Input validation

## 📁 Project Structure

```
backend/
├── models/                 # Database models
│   ├── User.js            # User model
│   ├── Issue.js           # Issue model
│   └── Feedback.js        # Feedback model
├── routes/                # API routes
│   ├── auth.js            # Authentication routes
│   ├── users.js           # User management routes
│   ├── issues.js          # Issue management routes
│   ├── feedback.js        # Feedback routes
│   └── analytics.js       # Analytics routes
├── middleware/            # Custom middleware
│   └── auth.js            # Authentication & authorization
├── uploads/               # File upload directory
├── .env                   # Environment variables
├── server.js              # Main server file
├── package.json           # Dependencies
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file with the following variables:
```env
MONGO_URI=mongodb+srv://ram:ram123@cluster0.l2uivdm.mongodb.net/civicTracker?retryWrites=true&w=majority
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

4. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/pending-managers` - Get pending managers (admin only)
- `PUT /api/users/:id/approve` - Approve manager (admin only)
- `PUT /api/users/:id/reject` - Reject manager (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (admin only)

### Issues
- `GET /api/issues` - Get all issues with filtering
- `GET /api/issues/:id` - Get single issue
- `POST /api/issues` - Create new issue (citizen only)
- `PUT /api/issues/:id` - Update issue (manager/admin only)
- `POST /api/issues/:id/vote` - Vote for issue
- `DELETE /api/issues/:id/vote` - Remove vote
- `POST /api/issues/:id/comments` - Add comment
- `DELETE /api/issues/:id` - Delete issue (admin only)

### Feedback
- `GET /api/feedback` - Get all feedback (admin/authority only)
- `GET /api/feedback/analytics` - Get feedback analytics
- `POST /api/feedback` - Create new feedback
- `GET /api/feedback/:id` - Get single feedback
- `PUT /api/feedback/:id/review` - Mark as reviewed
- `PUT /api/feedback/:id/address` - Mark as addressed
- `DELETE /api/feedback/:id` - Delete feedback (admin only)

### Analytics
- `GET /api/analytics` - Get system analytics (admin only)
- `GET /api/analytics/user` - Get user-specific analytics
- `GET /api/analytics/dashboard` - Get dashboard statistics

## 🔐 Role-Based Access

### Citizens
- Can report issues
- Can vote on issues
- Can add comments
- Can submit feedback
- Can view their own issues

### Authorities
- Can view all issues
- Can update issue status
- Can assign issues
- Can view feedback
- Can respond to feedback

### Admins
- Full system access
- User management
- Authority approval
- System analytics
- Complete control

## 📧 Email Domain Validation

The system enforces specific email domains for each role:

- **Citizens**: Must use `@gmail.com`
- **Authorities**: Must use `@gov.in`
- **Admins**: Must use `@admin.com`

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- CORS protection
- Helmet security headers
- File upload restrictions

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String,
  password: String,
  role: ['citizen', 'manager', 'admin'],
  status: ['active', 'pending', 'rejected'],
  phone: String,
  address: String,
  avatar: String,
  lastLogin: Date
}
```

### Issue Model
```javascript
{
  title: String,
  description: String,
  category: String,
  location: String,
  status: ['open', 'in-progress', 'resolved'],
  priority: ['low', 'medium', 'high', 'urgent'],
  reportedBy: ObjectId,
  assignedTo: ObjectId,
  images: [String],
  votes: [ObjectId],
  comments: [Object],
  tags: [String]
}
```

### Feedback Model
```javascript
{
  user: ObjectId,
  issue: ObjectId,
  category: String,
  rating: Number (1-5),
  message: String,
  anonymous: Boolean,
  status: ['pending', 'reviewed', 'addressed'],
  adminResponse: String
}
```

## 🚀 Deployment

### Environment Variables
```env
NODE_ENV=production
MONGO_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
PORT=5000
```

### Production Considerations
- Use a strong JWT secret
- Enable MongoDB authentication
- Set up proper CORS origins
- Configure rate limiting
- Set up logging
- Use HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.
