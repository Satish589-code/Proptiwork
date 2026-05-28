# ProptiWork Insights

ProptiWork Insights is an employee productivity tracking and analytics platform built and maintained by Satish Prajapati.

## Overview

This project combines a React dashboard with a Chrome extension to help teams monitor work sessions, track browsing activity during active sessions, manage tasks, and review productivity trends in one place.

## Key Features

- Secure authentication with Supabase
- Role-based dashboards for admins and employees
- Work session and activity tracking
- Productivity analytics and reporting views
- Task management for teams and individual users
- Chrome extension for browser activity capture

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Query
- Supabase
- Chrome Extension Manifest V3

## Project Structure

- `src/` - main web application
- `proptiwork-extension/` - browser extension for activity tracking
- `public/` - static assets

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

```sh
npm install
```

### Environment Variables

Create or update your `.env` file with:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

### Run the App

```sh
npm run dev
```

### Build the App

```sh
npm run build
```

## Chrome Extension Setup

1. Open `chrome://extensions/`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `proptiwork-extension` folder

## Author

Satish Prajapati  
Email: satish1prajapati0157@gmail.com
