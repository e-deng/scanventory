# Scanventory

A smart pantry management application that allows you to track your pantry inventory, scan barcodes, and manage expiration dates efficiently.

## Features

- 📦 **Pantry Management**: Add, edit, and remove items from your pantry
- 🔍 **Barcode Scanning**: Scan barcodes to automatically fetch product information from OpenFoodFacts API
- 📅 **Expiration Tracking**: Track expiration dates and get alerts for items expiring soon
- 🏷️ **Smart Categorization**: Automatic category and shelf assignment based on product type
- 📱 **Responsive Design**: Works on both desktop and mobile devices
- 🎨 **Modern UI**: Clean, intuitive interface built with Next.js and Tailwind CSS

## Project Structure

```
scanventory/
├── app/                 # Next.js frontend application
├── components/          # React components
├── components/ui/       # UI components (Button, Card, Badge, etc.)
├── lib/                 # Utility functions and API client
├── server/              # Express.js backend API
├── server/models/       # MongoDB models
├── server/routes/       # API routes
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your MongoDB connection string:
   ```bash
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   NODE_ENV=development
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the project root:
   ```bash
   cd ..
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:3000`

## Usage

1. **Add Items**: Use the "Add Item" button or scan barcodes to add items to your pantry
2. **Barcode Scanning**: Enter barcodes manually or use the demo scan buttons to test
3. **Manage Inventory**: Edit quantities, change locations, and update expiration dates
4. **Track Expiration**: View alerts for items expiring soon
5. **Organize by Shelf**: Switch between list and shelf view to organize your pantry

## Example Barcodes

You can test the application with these sample barcodes:
- `3017620422003` - Nutella
- `5000159407236` - Snickers

## API Endpoints

- `GET /api/items` - Get all pantry items
- `POST /api/items` - Create a new item
- `PUT /api/items/:id` - Update an item
- `DELETE /api/items/:id` - Delete an item
- `GET /api/alerts` - Get expiration alerts
- `PUT /api/alerts/:id/dismiss` - Dismiss an alert

## Technologies Used

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- CORS for cross-origin requests

## Database Seeding

To populate the database with sample data:

```bash
cd server
npm run seed
```

This will add 5 sample food items to your pantry for testing. 