# DEVPLUS APP - STUDENT MOBILE APP TEST CASES

This document provides test cases for validating the DevPlus Mobile App (Student role) across assigned use cases, ensuring all features function properly with the Supabase database.

---

## 🟢 1. AUTHENTICATION & AUTHORIZATION
### Test Case 1.1: Login (Developer Bypass)
- **Use Case:** UC-1.1
- **Steps:**
  1. Open the application (or run `npm run web`).
  2. In the Email field, type `test`.
  3. In the Password field, enter any password (e.g., `1234`).
  4. Tap the "Sign In" button.
- **Expected Result:** Successfully authenticated and redirected to HomeScreen, displaying the student name "Somchai Jaidee (Test Mode)".

### Test Case 1.2: Logout
- **Use Case:** UC-1.2
- **Steps:**
  1. Navigate to the "Profile" tab (far right).
  2. Scroll down to the bottom and tap "Log Out".
  3. Confirm logout on the dialog prompt.
- **Expected Result:** User is immediately redirected to LoginScreen.

---

## 🟢 2. PROFILE MANAGEMENT
### Test Case 2.1: View Personal Profile
- **Use Case:** UC-2.2
- **Steps:**
  1. Log in to the application.
  2. Navigate to the "Profile" tab.
- **Expected Result:** Displays student personal profile information (Email, Phone, Location) fetched from the `profiles` table in the database.

### Test Case 2.2: Edit Personal Profile
- **Use Case:** UC-2.3
- **Steps:**
  1. On the Profile screen, tap the "Edit Profile" button (blue icon).
  2. Update the phone number (Phone) or address (Location).
  3. Tap "Save Changes".
- **Expected Result:** An alert confirms successful update, and the Profile screen displays the newly updated information (persisted to Supabase).

---

## 🟢 3. TRAINING PLAN
### Test Case 3.1: View Training Plan
- **Use Case:** UC-3.2
- **Steps:**
  1. Navigate to the "Training" tab.
- **Expected Result:** Displays the training curriculum fetched from the `training_plans` table, including training phase titles, duration, and progress status.

---

## 🟢 4. ATTENDANCE (GPS CHECK-IN)
### Test Case 4.1: GPS Check-in
- **Use Case:** UC-5.1
- **Steps:**
  1. Navigate to the "Home" tab.
  2. The system retrieves your current GPS coordinates and calculates the distance to the office (96 Nguyen Dinh Hoan).
  3. Tap the large green "Check In" button in the center.
- **Expected Result:** 
  - If distance is **within 500 meters**: Check-in is recorded successfully and the work timer begins.
  - If distance is **greater than 500 meters**: An alert notifies "Outside company radius" (You can tap the Bypass Location button to simulate being near the office).

### Test Case 4.2: View Attendance History
- **Use Case:** UC-5.3
- **Steps:**
  1. Navigate to the "Home" tab.
  2. Tap the "View History" button beneath the Check-in button.
- **Expected Result:** Navigates to Attendance History, displaying previous attendance records (retrieved from the `attendances` table) with check-in/out times and status (e.g., On Time, Late).

---

## 🟢 5. LEAVE REQUEST
### Test Case 5.1: Submit Leave Request
- **Use Case:** UC-6.1
- **Steps:**
  1. From Home screen, tap "Leave Request" (or access via quick actions).
  2. Enter the leave date range (Start Date - End Date).
  3. Select leave type (e.g., Sick Leave, Personal Leave).
  4. Provide a reason and tap "Submit Request".
- **Expected Result:** Leave request is saved to the `leave_requests` table and returns to the main screen.

### Test Case 5.2: View Leave Request Status
- **Use Case:** UC-6.2
- **Steps:**
  1. Navigate to the Leave Request screen.
  2. View "My Requests" or "Pending Requests" section.
- **Expected Result:** Displays previously submitted requests and their current real-time status (e.g., Pending, Approved) from the database.

---

## 🟢 6. Q&A MANAGEMENT
### Test Case 6.1: Submit & View Q&A
- **Use Case:** UC-8.1, UC-8.2
- **Steps:**
  1. Navigate to the "Q&A" tab (chat icon).
  2. Tap "+ New Question".
  3. Enter question Title and Content.
  4. Tap "Submit".
  5. Return to Q&A feed.
- **Expected Result:** The newly posted question appears in the feed (from `qa_questions`). Once a mentor replies, the answers appear in the detail screen (from `qa_answers`).

---

## 🟢 7. EVENT MANAGEMENT
### Test Case 7.1: View Event List & Details
- **Use Case:** UC-9.1
- **Steps:**
  1. On the Home screen, scroll down to "Upcoming Events" (or tap Events/Announcements calendar icon).
  2. Review the displayed events.
  3. Tap an event to view full details.
- **Expected Result:** Displays the event details fetched from the `events` table in Supabase (including date, venue/location, and description).
