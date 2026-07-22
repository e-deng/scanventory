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
├── app/api/             # Next.js API routes (backend, runs on Vercel)
├── components/          # React components
├── components/ui/       # UI components (Button, Card, Badge, etc.)
├── lib/                 # Utility functions, API client, MongoDB connection
├── lib/models/           # Mongoose models (Item, Alert)
└── README.md
```

The app is a single full-stack Next.js project: the frontend and the API
routes deploy together as one Vercel project, backed by MongoDB (Atlas in
production).

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with your MongoDB connection string:
   ```bash
   MONGODB_URI=your_mongodb_connection_string
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The app (frontend + API routes) will run on `http://localhost:3000`

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
- Next.js API routes (app/api/)
- MongoDB with Mongoose

## Database Seeding

To populate the database with sample data, use the app's "Add Item" flow or
insert documents directly into your MongoDB database's `items` collection.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Create a MongoDB Atlas cluster (free tier is fine) and get its connection string.
3. Import the repo in Vercel and set the `MONGODB_URI` environment variable.
4. Deploy — the frontend and API routes ship together as one Vercel project. 