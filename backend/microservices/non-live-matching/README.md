# GiniVibe Non-Live Matching Microservice

## 1. Purpose
Handles asynchronous profile matching, swipes, likes, and algorithmic partner recommendations when users are not actively in the Live Matching queue.

## 2. Responsibility
**Owns:**
- The algorithmic recommendation engine for profile suggestions
- Swipe/Like logic and match persistence
- Compatibility scoring logic

## 3. Position in Architecture
Interfaces with the `monolithic` database to read user profiles and write matches, but isolates the heavy recommendation computation from the main API thread.

## 4. How To Run
```bash
cd backend/microservices/non-live-matching
npm install
npm run dev
```
