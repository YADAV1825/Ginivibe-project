# PHASE 9: End-to-End Testing Guide

## Overview
This guide provides step-by-step instructions to verify the complete Events feature implementation across database, backend, and frontend layers.

---

## Setup: Prerequisites
1. **Backend Running**: `npm run dev` in `backend/microservices/` (monolith on port 3001 and Events service on port 3002)
2. **Frontend Running**: `npm start` or `expo start` in `frontend-app/`
3. **Database**: PostgreSQL running via `docker-compose up` in `db/`
4. **Authentication**: Have a valid JWT token or test user credentials

### Service Health Check
```bash
curl http://localhost:3002/health
```

Expected response:
```json
{"status":"ok","service":"events-service"}
```

### Getting a Test Token
If you need to generate a test JWT manually:
```bash
# From backend terminal
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: 'test-user-id', email: 'test@example.com' },
  process.env.JWT_SECRET || 'your_jwt_secret',
  { expiresIn: '7d' }
);
console.log(token);
"
```

---

## Test Cases

### TEST 1: Create Online Event
**Goal**: Verify creating an online event with all required fields

**Steps**:
1. Open Events screen → tap "Events" tab
2. Tap the "+" button (Create Event)
3. Fill in:
   - Title: "Test Zoom Meeting"
   - Description: "Testing online event creation"
   - Mode: Select "Online"
   - Start Date: Today's date (YYYY-MM-DD format)
   - Start Time: 2 hours from now (HH:MM format)
   - End Date: Same as start date
   - End Time: 1 hour after start time
   - Meeting URL: https://zoom.us/j/12345
   - Platform: Zoom (optional)
4. Tap "Create Event"

**Expected Results**:
- ✅ Success alert appears
- ✅ Navigates back to Events list
- ✅ "Live Events" or "Future Events" list updates (based on time)
- ✅ New event appears with correct title and attendee count: 1 (organizer)

**Failure Points to Check**:
- Missing title → "Please enter event title" error
- Missing meeting URL → "Please enter meeting URL for online events" error
- End time before start time → "End time must be after start time" error

---

### TEST 2: Create Offline Event
**Goal**: Verify creating an offline event with venue details

**Steps**:
1. Open Events screen → tap "Create Event"
2. Fill in:
   - Title: "Test Coffee Meetup"
   - Description: "Meeting for coffee and networking"
   - Mode: Select "In-Person"
   - Dates/Times: Same as TEST 1
   - Venue: "Central Coffee House"
   - Location: "123 Main St, Downtown, City, 12345"
   - Capacity: 50 (optional)
3. Tap "Create Event"

**Expected Results**:
- ✅ Success alert appears
- ✅ Event created with offline venue details
- ✅ No meeting URL or platform fields shown (correctly hidden)

**Verification**:
- Navigate to event detail → should show venue and location, NOT meeting URL

---

### TEST 3: Event Discovery - Browse Live Events
**Goal**: Verify event filtering by status

**Steps**:
1. From Events list, tap "Live Events"
2. Observe event list

**Expected Results**:
- ✅ Only events with startAt ≤ now AND endAt > now appear
- ✅ Events show with time badge: "Starting soon" or "In Xh"
- ✅ Pulse animation visible on "Live Events" category
- ✅ Empty state if no live events

---

### TEST 4: Event Discovery - Browse Future Events
**Goal**: Verify future event filtering

**Steps**:
1. From Events list, tap "Future Events"

**Expected Results**:
- ✅ Only events with startAt > now appear
- ✅ No pulse animation (not a "live" status)
- ✅ Time badges show "In Xd" or dates

---

### TEST 5: Event Discovery - Online vs Offline Filter
**Goal**: Verify mode-based filtering

**Steps**:
1. Tap "Online Events"
2. Observe only online events (those with meetingUrl)
3. Go back, tap "Offline Events"
4. Observe only offline events (those with venue/location)

**Expected Results**:
- ✅ Online events show platform/meeting URL info
- ✅ Offline events show venue/location info
- ✅ No cross-contamination between modes

---

### TEST 6: Event Detail View
**Goal**: Verify event details are displayed correctly

**Steps**:
1. From any event list, tap on an event
2. Observe full event details

**Expected Results**:
- ✅ Event title and description displayed
- ✅ Status badge shows: "LIVE" (red), "FUTURE" (blue), or "ENDED" (gray)
- ✅ Date and time formatted clearly
- ✅ Event mode (online/offline) with corresponding details:
  - Online: Platform and Meeting URL (clickable?)
  - Offline: Venue and Location
- ✅ Organizer profile card shows name/avatar
- ✅ Attendees list shows first 5 + count of remaining
- ✅ RSVP buttons for "Attend" and "Interested"

---

### TEST 7: RSVP - Attend Event
**Goal**: Verify user can RSVP to attend an event

**Steps**:
1. Open event detail
2. Note current attendee count (e.g., "5 attending")
3. Tap "Attend" button
4. Observe response

**Expected Results**:
- ✅ Button state changes to "Cancel" or appears pressed
- ✅ Attendee count increases by 1 (e.g., "6 attending")
- ✅ Network request sent to POST /api/events/{id}/rsvp
- ✅ Loading state appears briefly during API call

**Backend Verification**:
```bash
# Check EventAttendee record was created
psql -U postgres -d ginivibe -c "SELECT * FROM \"EventAttendee\" WHERE \"rsvpStatus\" = 'GOING' LIMIT 1;"
```

---

### TEST 8: RSVP - Change to Interested
**Goal**: Verify user can change RSVP status

**Steps**:
1. From previous RSVP state (already "Attending")
2. Tap "Interested" button

**Expected Results**:
- ✅ Status changes from "Attend" to "Interested"
- ✅ Attendee count stays same (still counting as attendee)
- ✅ Button UI updates to reflect new status

**Backend Verification**:
```bash
psql -U postgres -d ginivibe -c "SELECT \"rsvpStatus\" FROM \"EventAttendee\" WHERE \"eventId\" = 'event-id' AND \"userId\" = 'user-id';"
```
Output should show: `INTERESTED`

---

### TEST 9: RSVP - Cancel
**Goal**: Verify user can cancel RSVP

**Steps**:
1. From event detail where user has already RSVPed
2. Tap the active RSVP button again (e.g., "Attend" if already attending)

**Expected Results**:
- ✅ Buttons return to neutral state
- ✅ Attendee count decreases by 1
- ✅ User no longer appears in attendees list

**Backend Verification**:
```bash
# Should return no rows (RSVP deleted)
psql -U postgres -d ginivibe -c "SELECT * FROM \"EventAttendee\" WHERE \"eventId\" = 'event-id' AND \"userId\" = 'user-id';"
```

---

### TEST 10: My Organized Events
**Goal**: Verify user sees only events they created

**Steps**:
1. From Events list (main screen)
2. Scroll down to "My Events" section
3. Tap "My Organized"

**Expected Results**:
- ✅ Only events with organizerId = currentUserId appear
- ✅ All events created in TEST 1 and TEST 2 should be here
- ✅ Other users' events are NOT shown

---

### TEST 11: My Attending Events
**Goal**: Verify user sees only events they RSVPed to

**Steps**:
1. From Events list
2. Tap "My Attending"

**Expected Results**:
- ✅ Only events where user has RSVP record appear
- ✅ Events from TEST 7 (where user attended) should be here
- ✅ User's organized events should NOT appear (unless they also RSVPed)

---

### TEST 12: Error Handling - Invalid Date Format
**Goal**: Verify form validates date format

**Steps**:
1. Try to create event with invalid date (e.g., "13-32-2024" or "abc")
2. Submit form

**Expected Results**:
- ✅ Error message appears
- ✅ Date parsing fails gracefully
- ✅ No network request sent

---

### TEST 13: Error Handling - End Before Start
**Goal**: Verify time validation

**Steps**:
1. Create event with:
   - Start: 2024-01-15 14:00
   - End: 2024-01-15 12:00 (before start!)
2. Submit

**Expected Results**:
- ✅ Alert: "End time must be after start time"
- ✅ No event created

---

### TEST 14: Error Handling - Missing Required Fields
**Goal**: Verify all required fields are validated

**Steps**:
1. Try each missing field scenario:
   - No title
   - No start date
   - No end time
   - Online mode without meeting URL
   - Offline mode without venue
2. Attempt to create event

**Expected Results**:
- ✅ Specific error message for each missing field
- ✅ Form stays open (not submitted)

---

### TEST 15: Network Error Handling
**Goal**: Verify graceful error when backend is unreachable

**Steps**:
1. Kill backend server (Ctrl+C)
2. Try to create an event or fetch events
3. Observe error state

**Expected Results**:
- ✅ Error message appears (not a blank screen crash)
- ✅ User can go back and retry
- ✅ No silent failures

---

## Advanced Tests

### TEST 16: Concurrent RSVP
**Goal**: Verify RSVP duplicate prevention

**Steps** (requires multiple test devices/accounts):
1. User A and User B both tap "Attend" on same event simultaneously
2. Both receive success

**Expected Results**:
- ✅ Both users added to attendees
- ✅ Attendee count = 2
- ✅ Database constraint prevents duplicates

---

### TEST 17: Filter Combinations
**Goal**: Verify multiple filters work together

**Steps**:
1. Create 4 test events:
   - Event A: Live + Online
   - Event B: Live + Offline
   - Event C: Future + Online
   - Event D: Future + Offline
2. Verify each filter shows correct subset

**Expected Results**:
- ✅ "Live Events" shows A + B
- ✅ "Future Events" shows C + D
- ✅ "Online Events" shows A + C
- ✅ "Offline Events" shows B + D

---

### TEST 18: Organizer-Only Permissions
**Goal**: Verify only organizer can edit/delete events

**Steps** (requires two user accounts):
1. User A creates event
2. User B opens event detail
3. Check if edit/delete buttons visible

**Expected Results**:
- ✅ User A sees edit/delete buttons
- ✅ User B does NOT see edit/delete buttons
- ✅ Attempting to edit as User B returns 403 Forbidden

---

### TEST 19: Token Expiry
**Goal**: Verify API handles expired tokens

**Steps**:
1. Clear AsyncStorage of auth token
2. Try to create event

**Expected Results**:
- ✅ 401 Unauthorized error OR
- ✅ Redirect to login screen
- ✅ Clear error message

---

### TEST 20: Performance - Large Event Lists
**Goal**: Verify performance with many events

**Steps**:
1. Create 50+ events via backend
2. Fetch "Live Events" or "Future Events"
3. Scroll through list

**Expected Results**:
- ✅ List loads in <2 seconds
- ✅ Smooth scrolling (no jank)
- ✅ Memory usage reasonable
- ✅ No UI freezes

---

## Regression Testing
After all new tests pass, verify existing features still work:

- [ ] **Auth Feature**: Login/logout works, token stored correctly
- [ ] **Astrology Feature**: Browse, filter, create astrology entries
- [ ] **Feed Feature**: View feed, new events update feed
- [ ] **Profile Feature**: View/edit profile
- [ ] **Navigation**: Tab navigation between all screens
- [ ] **Animations**: All transitions smooth and performant
- [ ] **Dark Theme**: Dark mode applied consistently

---

## Backend Verification Checklist
```bash
# Test each endpoint manually with curl

# 1. Get all events
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/events

# 2. Get live events
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/events?status=live

# 3. Get online events
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/events?mode=online

# 4. Get specific event
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/events/EVENT_ID

# 5. Create event
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "startAt": "2024-01-20T14:00:00Z",
    "endAt": "2024-01-20T15:00:00Z",
    "mode": "ONLINE",
    "meetingUrl": "https://zoom.us/j/123"
  }' http://localhost:3001/api/events

# 6. RSVP to event
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "GOING"}' \
  http://localhost:3001/api/events/EVENT_ID/rsvp

# 7. Get my organized events
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/events/me/organized

# 8. Get my attending events
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/events/me/attending
```

---

## Database Verification Checklist
```sql
-- Check Events table
SELECT COUNT(*) FROM "Event";
SELECT * FROM "Event" LIMIT 5;

-- Check EventAttendee table
SELECT COUNT(*) FROM "EventAttendee";
SELECT * FROM "EventAttendee" LIMIT 5;

-- Check specific user's events
SELECT * FROM "Event" WHERE "organizerId" = 'USER_ID';

-- Check specific user's RSVP records
SELECT * FROM "EventAttendee" WHERE "userId" = 'USER_ID';

-- Verify unique constraint on EventAttendee
SELECT "eventId", "userId", COUNT(*) FROM "EventAttendee" 
GROUP BY "eventId", "userId" HAVING COUNT(*) > 1;
-- Should return 0 rows
```

---

## Success Criteria
✅ **PHASE 9 Complete** when:
- All 20 test cases pass
- No console errors in frontend
- No server errors in backend logs
- Database maintains data integrity
- Existing features still work (regression tests pass)
- Performance is acceptable (no noticeable lag)

---

## Common Issues & Troubleshooting

### Issue: "401 Unauthorized" on API calls
**Solution**: 
- Check token is stored in AsyncStorage
- Verify token hasn't expired
- Check Authorization header format: `Bearer TOKEN`

### Issue: Event doesn't appear after creation
**Solution**:
- Verify event timestamps (startAt/endAt in future or within current window)
- Check database directly: `SELECT * FROM "Event" WHERE title = 'your_event';`
- Verify event status calculation logic

### Issue: RSVP button doesn't update
**Solution**:
- Check network request in dev tools
- Verify user is authenticated
- Check EventAttendee record created in database

### Issue: "My Events" shows no events
**Solution**:
- Verify organizerId matches currentUserId in database
- Check useMyEvents hook is receiving correct userId
- Verify AsyncStorage has auth token

### Issue: Date input not working
**Solution**:
- Ensure format is exactly YYYY-MM-DD for dates
- Ensure format is exactly HH:MM for times (24-hour format)
- Browser console should show parsing error if format wrong

---

## Sign-Off
When all tests pass, update this document and commit:
```bash
git add TESTING.md
git commit -m "PHASE 9: E2E testing complete - all test cases passed"
```
