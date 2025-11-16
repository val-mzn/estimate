# EstiMate

A real-time Planning Poker application for agile teams to estimate task effort collaboratively. EstiMate enables teams to vote on task complexity using customizable card sets, view statistical analysis of estimates, and reach consensus through an intuitive web interface.

## Features

### Core Functionality
- **Room Management**: Create or join estimation rooms with unique room codes
- **Task Management**: Add, delete, and organize tasks for estimation
- **Real-time Voting**: Vote on tasks using customizable card sets (e.g., Fibonacci, T-shirt sizes)
- **Estimate Reveal**: Reveal or hide votes to facilitate discussion
- **Statistical Analysis**: Automatic calculation of average and median estimates
- **Final Estimates**: Set and track final estimates for each task
- **Participant Management**: Support for creators, participants, and spectators
- **Creator Participation Mode**: Room creators can optionally participate in voting

### User Experience
- **Real-time Synchronization**: Live updates via WebSocket (Socket.IO)
- **Multi-language Support**: English and French interfaces
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Vote Progress Tracking**: Visual indicators showing voting status
- **Task Statistics**: View estimation metrics and progress

## Tech Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **Database**: SQLite with Prisma ORM
- **Language**: TypeScript

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Radix UI
- **State Management**: Zustand
- **Internationalization**: i18next
- **Charts**: Recharts

## Quick Start

### Prerequisites
- Node.js 20+ and npm
- Docker and Docker Compose (optional, for containerized deployment)

### Option 1: Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd estimate
```

2. Start the application:
```bash
docker-compose up -d
```

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

The Docker setup automatically:
- Builds both frontend and backend containers
- Sets up the database with Prisma migrations
- Configures networking between services

### Option 2: Local Development

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma migrate deploy
```

4. Configure environment variables (optional):
```bash
export PORT=3001
export FRONTEND_URL=http://localhost:5173
export DATABASE_URL=file:./prisma/data/estimate.db
```

5. Start the backend:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (optional):
```bash
export VITE_API_URL=http://localhost:3001
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. **Create a Room**: Click "Create a room" on the homepage, enter your name, room name, and select a card set
2. **Join a Room**: Click "Join a room" and enter the room code provided by the creator
3. **Add Tasks**: As the room creator, add tasks that need estimation
4. **Select a Task**: Click on a task to start the estimation process
5. **Vote**: Participants vote by selecting a card value
6. **Reveal Votes**: The creator can reveal all votes to see the distribution
7. **Set Final Estimate**: After discussion, set the final estimate for the task
8. **Track Progress**: View completed tasks and overall estimation progress

## Project Structure

```
estimate/
├── Backend/              # Node.js backend application
│   ├── src/
│   │   ├── handlers/    # Socket.IO event handlers
│   │   ├── services/    # Business logic services
│   │   ├── db/          # Database configuration
│   │   └── server.ts    # Express and Socket.IO server
│   ├── prisma/          # Prisma schema and migrations
│   └── package.json
├── Frontend/            # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── stores/      # Zustand state stores
│   │   └── services/    # API and socket services
│   └── package.json
└── docker-compose.yml   # Docker Compose configuration
```

## Development

### Backend Scripts
- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Start the production server
- `npm run dev`: Start development server with watch mode

### Frontend Scripts
- `npm run dev`: Start Vite development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## Environment Variables

### Backend
- `PORT`: Server port (default: 3001)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)
- `DATABASE_URL`: Prisma database connection string

### Frontend
- `VITE_API_URL`: Backend API URL (default: http://localhost:3001)

## License

MIT License

