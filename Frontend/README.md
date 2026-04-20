# Civic Issue Tracker - Frontend

A modern, responsive React application for tracking and resolving civic issues in communities. Built with React, Tailwind CSS, and featuring a beautiful 3D UI design.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure login/register system with role-based access
- **Issue Reporting**: Citizens can report issues with images and detailed descriptions
- **Issue Tracking**: Real-time status tracking of reported issues
- **Voting System**: Community voting on issue priority
- **Feedback System**: Users can provide feedback on resolved issues
- **Role-Based Dashboards**: Different interfaces for Citizens, Authorities, and Admins

### User Roles
- **Citizens**: Report issues, track status, vote, and give feedback
- **Authorities**: Manage and resolve issues, update status
- **Admins**: Full system management, user management, analytics

### UI/UX Features
- **3D Design**: Modern glassmorphism and 3D effects
- **Responsive Design**: Works perfectly on all devices
- **Real-time Updates**: Live status updates and notifications
- **Beautiful Animations**: Smooth transitions and micro-interactions
- **Dark Mode Support**: Easy on the eyes (configurable)

## 🛠️ Technology Stack

- **Frontend**: React 18
- **Styling**: Tailwind CSS with custom 3D effects
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Authentication**: JWT tokens
- **Icons**: SVG icons (inline)
- **Build Tool**: Create React App

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── Navbar.jsx      # Navigation bar
│   ├── IssueCard.jsx   # Issue display card
│   └── ProtectedRoute.jsx # Route protection
├── context/            # React Context
│   └── AuthContext.jsx # Authentication context
├── pages/              # Page components
│   ├── Home.jsx        # Landing page
│   ├── Login.jsx       # Login page
│   ├── Register.jsx    # Registration page
│   ├── Dashboard.jsx   # Main dashboard
│   ├── ReportIssue.jsx # Issue reporting
│   ├── TrackIssues.jsx # Issue tracking
│   ├── Feedback.jsx    # Feedback system
│   └── AdminDashboard.jsx # Admin panel
├── services/           # API services
│   └── api.js          # Axios configuration
├── App.jsx             # Main App component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (blue-500 to blue-600)
- **Secondary**: Purple gradient (purple-500 to purple-600)
- **Success**: Green gradient (green-500 to green-600)
- **Warning**: Yellow gradient (yellow-500 to yellow-600)
- **Danger**: Red gradient (red-500 to red-600)

### 3D Effects
- **Glass Cards**: `glass-3d` class for frosted glass effect
- **3D Shadows**: `shadow-3d` and `shadow-3d-lg` for depth
- **Button Effects**: `button-3d` for interactive buttons
- **Hover Animations**: Scale and shadow transitions
- **Floating Elements**: `float-animation` for dynamic movement

### Status Colors
- **Open**: Yellow background with yellow text
- **In Progress**: Blue background with blue text
- **Resolved**: Green background with green text

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd civic-issue-tracker-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

## 🔐 Authentication

### Demo Accounts
- **Citizen**: `citizen@civic.com` / `password123`
- **Authority**: `authority@civic.com` / `password123`
- **Admin**: `admin@civic.com` / `password123`

### JWT Token Management
- Tokens are stored in localStorage
- Automatic token injection in API requests
- Token validation and refresh handling

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Features
- Collapsible navigation menu
- Touch-friendly buttons and forms
- Optimized layouts for small screens

## 🔄 API Integration

### Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/issues` - Get all issues
- `POST /api/issues` - Create new issue
- `PUT /api/issues/:id` - Update issue
- `POST /api/issues/:id/vote` - Vote on issue
- `GET /api/feedback` - Get feedback
- `POST /api/feedback` - Submit feedback

### Error Handling
- Global error handling with user-friendly messages
- Form validation with real-time feedback
- Network error detection and retry logic

## 🎯 Key Features Explained

### Issue Reporting
- Multi-category selection with icons
- Image upload with preview
- Location input
- Rich text description
- Form validation

### Issue Tracking
- Advanced filtering (status, category, search)
- Real-time status updates
- Voting system
- Progress indicators
- Sorting options

### Dashboard System
- Role-specific layouts
- Statistics and analytics
- Quick action cards
- Recent activity feeds
- Performance metrics

### Admin Panel
- User management
- System analytics
- Issue management
- Performance monitoring
- Export functionality

## 🎨 Custom Components

### IssueCard Component
- Displays issue information
- Status indicators
- Voting functionality
- Action buttons (role-based)
- Image support

### Navbar Component
- Responsive navigation
- User profile display
- Role-based menu items
- Mobile hamburger menu

### ProtectedRoute Component
- Route protection logic
- Role-based access control
- Loading states
- Error handling

## 🔧 Customization

### Adding New Categories
1. Update the `categories` array in `ReportIssue.jsx`
2. Add corresponding icons
3. Update analytics if needed

### Modifying Colors
1. Edit `tailwind.config.js`
2. Update color variables in `index.css`
3. Modify component-specific colors

### Adding New Pages
1. Create page component in `src/pages/`
2. Add route in `App.jsx`
3. Update navigation if needed

## 📊 Performance Optimization

### Code Splitting
- Lazy loading for heavy components
- Route-based code splitting
- Image optimization

### Caching Strategy
- API response caching
- Static asset caching
- Service worker support

### Bundle Optimization
- Tree shaking enabled
- Minification in production
- Compression enabled

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify
1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables

### Deploy to Vercel
1. Import project from Git
2. Configure build settings
3. Add environment variables
4. Deploy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the demo accounts

## 🎯 Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app version
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Offline functionality
- [ ] Map integration for issues
- [ ] Advanced reporting features

---

**Built with ❤️ for better communities**
