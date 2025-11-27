# Aarogyam Backend API

This is the backend API for the Aarogyam healthcare application, providing services for appointment booking, medical reports, and contact forms.

## Features

- User authentication (registration and login)
- Appointment booking and management
- Medical report storage and retrieval with statistics
- Contact form handling
- RESTful API design
- MongoDB database integration
- JWT-based authentication
- Input validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## Setup

1. Clone the repository (if not already cloned)
2. Navigate to the backend directory:
   ```bash
   cd Aarogyam_backend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file in the root of the backend directory with the following variables:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/aarogyam
   JWT_SECRET=your_jwt_secret_key
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `GET /api/profile` - Get user profile (requires authentication)

### Appointments
- `POST /api/appointments` - Create a new appointment (requires authentication)
- `GET /api/appointments` - Get user appointments (requires authentication)
- `PUT /api/appointments/:id` - Update appointment status (requires authentication)
- `DELETE /api/appointments/:id` - Cancel appointment (requires authentication)

### Medical Reports
- `POST /api/reports` - Create a new medical report (requires authentication)
- `GET /api/reports` - Get user medical reports (requires authentication)
- `GET /api/reports/:id` - Get specific medical report (requires authentication)
- `PUT /api/reports/:id` - Update medical report (requires authentication)
- `DELETE /api/reports/:id` - Delete medical report (requires authentication)
- `GET /api/reports/stats` - Get medical report statistics (requires authentication)
- `GET /api/reports/:id/abnormalities` - Get abnormal values in a report (requires authentication)

### Contact
- `POST /api/contact` - Submit contact message
- `GET /api/contact` - Get contact messages (admin only)
- `PUT /api/contact/:id` - Update contact message status (admin only)
- `DELETE /api/contact/:id` - Delete contact message (admin only)

### Health Check
- `GET /api/health` - Server health check

## Data Models

### User
- name: String
- email: String (unique)
- password: String (hashed)
- phone: String
- role: String (patient, doctor, admin)
- createdAt: Date

### Appointment
- userId: ObjectId (reference to User)
- doctorId: ObjectId (reference to User)
- date: Date
- time: String
- status: String (pending, confirmed, cancelled, completed)
- reason: String
- notes: String
- createdAt: Date

### Medical Report
- userId: ObjectId (reference to User)
- title: String
- reportType: String (blood-test, urine-test, x-ray, mri, ct-scan, ecg, other)
- date: Date
- doctor: String
- hospital: String
- results: Mixed (flexible structure for different test types)
- attachments: [String] (URLs to uploaded files)
- notes: String
- createdAt: Date

### Contact Message
- name: String
- email: String
- subject: String
- message: String
- status: String (unread, read, replied)
- createdAt: Date

## Project Structure

```
Aarogyam_backend/
├── controllers/          # Route controllers
├── middleware/           # Custom middleware functions
├── models/               # Database models
├── utils/                # Utility functions
├── .env                  # Environment variables
├── server.js             # Main server file
├── package.json          # Project dependencies and scripts
└── README.md             # This file
```

## Frontend Integration

The backend API is designed to work with both the web and mobile frontends:

### Web Frontend (React)
- API service: `Aarogyam-master/src/utils/api.js`
- Components: AppointmentForm, MedicalReportForm, ContactForm

### Mobile Frontend (React Native/Expo)
- API service: `Aarogyam_Application/utils/api.ts`
- Screens: appointment.tsx, records.tsx, contact.tsx

## Environment Variables

Create a `.env` file in the backend root with these variables:

```env
PORT=5000                           # Server port
MONGODB_URI=mongodb://localhost:27017/aarogyam  # MongoDB connection string
JWT_SECRET=your_jwt_secret_key      # Secret for JWT token signing
```

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

To run in production mode:
```bash
npm start
```

## Testing

You can test the API endpoints using tools like Postman or curl. Here are some example requests:

### Register a new user
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "1234567890"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create an appointment (requires authentication)
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "doctorId": "doctor_object_id",
    "date": "2023-12-01",
    "time": "10:00",
    "reason": "Regular checkup"
  }'
```

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Input validation is performed on all endpoints
- CORS is enabled for web frontend integration

## Error Handling

The API returns appropriate HTTP status codes and JSON error messages:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Support

For issues or questions, please contact the development team."# Aarogyam_Backend" 
