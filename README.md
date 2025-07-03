# Incident Logger

A modern web application for logging and managing incidents in real-time. Built with React frontend and Express.js backend.

## Features

### 🚨 Incident Management
- **Report New Incidents**: Comprehensive form with severity levels, categories, and detailed descriptions
- **View All Incidents**: Table view with search, filtering, and sorting capabilities
- **Incident Details**: Full incident information with status tracking
- **Edit & Delete**: Manage existing incidents

### 📊 Dashboard
- **Real-time Statistics**: Total, open, investigating, and resolved incident counts
- **Recent Incidents**: Quick overview of latest incidents
- **Quick Actions**: Fast access to common tasks
- **Performance Metrics**: Resolution rates and response times

### 🎨 Modern UI
- **Material-UI Design**: Clean, professional interface
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Intuitive Navigation**: Bottom navigation for easy access
- **Color-coded Severity**: Visual indicators for incident priority

## Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **Material-UI** - Professional UI components
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

### Backend
- **Express.js** - Node.js web framework
- **CORS** - Cross-origin resource sharing
- **Body Parser** - Request body parsing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd incident-logger
   ```

2. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../server
   npm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm start
   ```
   The server will run on `http://localhost:5000`

2. **Start the frontend application**
   ```bash
   cd client
   npm start
   ```
   The application will open in your browser at `http://localhost:3000`

### Development Mode

For development with auto-reload:

```bash
# Backend (requires nodemon)
cd server
npm run dev

# Frontend
cd client
npm start
```

## API Endpoints

### Incidents
- `GET /api/incidents` - Get all incidents
- `GET /api/incidents/:id` - Get incident by ID
- `POST /api/incidents` - Create new incident
- `PUT /api/incidents/:id` - Update incident
- `DELETE /api/incidents/:id` - Delete incident

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent` - Get recent incidents

### Health Check
- `GET /api/health` - Server health status

## Incident Data Structure

```javascript
{
  id: 1,
  title: "Incident Title",
  description: "Detailed description",
  severity: "low|medium|high|critical",
  category: "safety|security|equipment|environmental|other",
  location: "Building, floor, room",
  reporterName: "Reporter Name",
  reporterEmail: "reporter@email.com",
  dateTime: "2024-01-15T10:30:00",
  status: "open|investigating|resolved",
  createdAt: "2024-01-15T10:30:00.000Z"
}
```

## Usage

### Reporting an Incident
1. Navigate to "New Incident" from the bottom navigation
2. Fill out the comprehensive form with incident details
3. Select appropriate severity and category
4. Provide location and reporter information
5. Submit the incident

### Viewing Incidents
1. Go to "All Incidents" to see the complete list
2. Use search to find specific incidents
3. Filter by severity or category
4. Click action buttons to view, edit, or delete incidents

### Dashboard Overview
1. The dashboard shows key statistics at a glance
2. View recent incidents for quick access
3. Use quick action buttons for common tasks
4. Monitor resolution rates and response times

## Project Structure

```
incident-logger/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Dashboard.js
│   │   │   ├── IncidentForm.js
│   │   │   ├── IncidentList.js
│   │   │   └── Navigation.js
│   │   ├── services/       # API services
│   │   │   └── api.js
│   │   └── App.js
│   └── package.json
├── server/                 # Express.js backend
│   ├── index.js           # Main server file
│   └── package.json
└── README.md
```

## Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] User authentication and authorization
- [ ] Email notifications for new incidents
- [ ] File attachments for incidents
- [ ] Advanced reporting and analytics
- [ ] Mobile app development
- [ ] Real-time notifications
- [ ] Incident assignment and workflow
- [ ] Export functionality (PDF, CSV)
- [ ] Integration with external systems

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.
