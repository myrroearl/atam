# Bulk Notifications Optimization

## Overview
This document describes the optimization of notification display for the admin notifications page. When admins create notifications targeted to specific groups (All Users, All Professors, or All Students), they now appear only once in the notifications table with proper labels, while still being stored individually in the database for each recipient.

## Changes Made

### 1. No Database Migration Required
The implementation uses frontend-only grouping based on message content and timing. No database schema changes are needed.

### 2. Type Definitions
**File:** `types/announcement.ts`

Updated the `Announcement` interface to include:
- `receiver_count?: number` - Number of recipients for display purposes

### 3. API Endpoints
**File:** `app/api/admin/announcements/route.ts`

#### GET Endpoint
- Groups notifications by message content and timestamp (within 5-second windows)
- Automatically deduplicates notifications sent to multiple users
- Determines group labels based on recipient roles:
  - Mixed students and professors → "All Users"
  - Only students → "All Students"
  - Only professors → "All Professors"
- Returns single representative notification with recipient count
- Maintains chronological order (newest first)

#### POST Endpoint
- Creates individual notifications for each recipient in database
- Returns single representative notification with proper labels
- Determines labels based on target users at creation time
- No special handling needed - works with existing schema

#### PUT Endpoint
- Updates single notification by notification_id
- Simpler approach - no special bulk handling
- Individual notifications can be edited separately

#### DELETE Endpoint
- Deletes single notification by notification_id
- Simpler approach - deletes one notification at a time

### 4. UI Components

#### Notifications Page
**File:** `app/admin/announcements/page.tsx`
- Displays recipient count for bulk notifications
- Shows proper labels (All Users, All Students, etc.)
- Maintains table structure and styling

#### Edit Announcement Modal
**File:** `components/admin/edit-announcement-modal.tsx`
- Detects bulk notifications
- Shows different info box for bulk vs specific notifications
- Hides receiver selection for bulk notifications
- Passes `bulk_id` to API for bulk updates
- Only tracks `account_id` changes for specific notifications

#### Delete Announcement Modal
**File:** `components/admin/delete-announcement-modal.tsx`
- Shows enhanced warning for bulk deletions
- Displays different messages for bulk vs specific deletions
- Indicates that all related notifications will be deleted

## How It Works

### Creating Notifications
1. Admin selects target group (All Users, All Students, All Professors, or Specific User)
2. Individual notifications are created for each recipient in the database
3. API returns a single representative notification with proper labels
4. All individual notifications are stored normally in the database

### Displaying Notifications
1. GET endpoint fetches all notifications
2. Notifications are grouped by message content and timestamp (within 5 seconds)
3. Only one representative notification per group is shown in the admin table
4. Receiver label is automatically determined by checking recipient roles:
   - Mixed students and professors → "All Users"
   - Only students → "All Students"
   - Only professors → "All Professors"
   - Single user → Shows user email
5. Recipient count is displayed when > 1

### Editing Notifications
1. Click edit on a notification (the representative one)
2. Updates only that single notification record
3. Changes don't automatically apply to other recipients
4. If you need to update all recipients, delete and recreate the bulk notification

### Deleting Notifications
1. Click delete on a notification (the representative one)
2. Deletes only that single notification record
3. Individual recipient notifications remain in database
4. User is warned that only the admin view entry is being deleted

### Sorting
- Notifications are sorted by `created_at` in descending order (newest first)
- This ensures new notifications automatically appear at the top of the table
- Sorting is done in the database query for optimal performance

## Benefits

1. **Clean UI**: Bulk notifications appear only once instead of cluttering the table
2. **Accurate Information**: Clear labels show who received the notification
3. **No Database Changes**: Works with existing schema
4. **User Experience**: New notifications always appear at the top
5. **Data Integrity**: All recipients still receive their notifications
6. **Simplicity**: Frontend-only grouping, no complex backend logic
7. **Performance**: Server-side deduplication

## Testing Recommendations

1. Create a notification to "All Students" and verify it appears once with label "All Students" and recipient count
2. Create a notification to "All Professors" and verify it appears once with label "All Professors" and recipient count
3. Create a notification to "All Users" and verify it appears once with label "All Users" and recipient count
4. Create a notification to a specific user and verify it appears normally (single email)
5. Verify new notifications appear at the top of the list
6. Verify the notifications are actually being sent to all recipients by checking individual user accounts

