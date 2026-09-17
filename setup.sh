#!/bin/bash

# GiniVibe Setup Script

echo "🚀 Welcome to GiniVibe Automated Setup!"
echo "----------------------------------------"

# 1. Start Database
echo "📦 Starting PostgreSQL database via Docker..."
cd db
sudo docker compose up -d
cd ..

# 2. Setup Backend
echo "⚙️ Setting up backend..."
cd backend/monolithic
npm install
# Generate Prisma Client
npx prisma generate
# Push schema to database (in case it's a fresh DB)
npx prisma db push
# Run seed script
npx tsx src/seed.ts
cd ../..

# 3. Setup Frontend Web
echo "🌐 Setting up Frontend Web (Next.js)..."
cd frontend-web
npm install
cd ..

# 4. Setup Frontend App
echo "📱 Setting up Frontend App (Expo)..."
cd frontend-app
npm install
cd ..

echo "----------------------------------------"
echo "✅ Setup Complete!"
echo ""
echo "To run the project, open three separate terminal tabs and run:"
echo "1. Backend:  cd backend/monolithic && npm run dev"
echo "2. Web App:  cd frontend-web && npm run dev"
echo "3. Mobile:   cd frontend-app && npm start"
echo ""
echo "Enjoy building GiniVibe! 🎉"
