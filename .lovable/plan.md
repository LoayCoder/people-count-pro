
# AI People Counting System - Production Transformation Plan

## Executive Audit Summary

This audit reveals a **demo-level application** with well-structured UI scaffolding and a solid database schema, but **zero functional backend integration**. All data is hardcoded mock data, authentication bypasses security, routes are unprotected, and no real counting logic exists.

---

## Part 1: Technical Audit Report

### Critical Issues (Severity: CRITICAL)

| ID | Issue | Location | Root Cause |
|----|-------|----------|------------|
| C1 | **No route protection** - All pages accessible without login | `App.tsx:28-37` | Missing AuthContext and ProtectedRoute wrapper |
| C2 | **Demo login bypasses authentication** | `Auth.tsx:62-64` | `handleDemoLogin()` navigates directly to "/" without any auth |
| C3 | **All data is hardcoded mock data** | Every page | No Supabase queries implemented anywhere |
| C4 | **No session management** | `App.tsx` | Missing `onAuthStateChange` listener |
| C5 | **Empty database** - Zero seed data | Database tables | No sites, cameras, zones, or test data seeded |
| C6 | **No edge functions exist** | `supabase/functions/` | Directory is completely empty - no backend processing |
| C7 | **No role enforcement in UI** | All pages | User role checks not implemented despite RBAC schema existing |
| C8 | **No logout functionality** | `Sidebar.tsx` | Logout button exists visually but has no handler |

### High Priority Issues (Severity: HIGH)

| ID | Issue | Location |
|----|-------|----------|
| H1 | Camera table uses mock array, not database | `Cameras.tsx:67-128` |
| H2 | Add Camera dialog doesn't save to database | `Cameras.tsx:212-301` |
| H3 | Configurator has static SVG, no interactive drawing | `Configurator.tsx:121-184` |
| H4 | Charts use static mock data | `OccupancyChart.tsx:11-24`, `InOutChart.tsx:12-21` |
| H5 | AlertsList is hardcoded | `AlertsList.tsx:17-53` |
| H6 | Reports cannot be generated or exported | `Reports.tsx:51-84` |
| H7 | Settings don't persist any changes | `Settings.tsx` - all switches/inputs are decorative |
| H8 | No file upload for recorded video | `RecordedAnalysis.tsx` - upload area is non-functional |
| H9 | No realtime subscriptions | All dashboard components - despite schema supporting it |
| H10 | Live Monitoring uses mock data | `LiveMonitoring.tsx:18-91` |
| H11 | Camera stats (15/12/2/1) are hardcoded | `Cameras.tsx:154-198` |
| H12 | Alert counts are hardcoded | `Alerts.tsx:145-150` |

### Medium Priority Issues (Severity: MEDIUM)

| ID | Issue | Location |
|----|-------|----------|
| M1 | No pagination on data tables | All table components |
| M2 | Missing loading states during data fetch | All data-fetching components |
| M3 | No error boundaries | App-wide - errors will crash entire app |
| M4 | Missing form validation | Camera/Settings forms have no client-side validation |
| M5 | No toast notifications on CRUD actions | All pages |
| M6 | Sidebar doesn't show current user info | `Sidebar.tsx` |
| M7 | Mobile responsiveness incomplete | `AppLayout.tsx:10` - Fixed 64px sidebar breaks on mobile |
| M8 | No empty states for tables when no data | All tables |

### UI/UX Issues (Severity: LOW)

| ID | Issue | Location |
|----|-------|----------|
| U1 | Missing user profile display in header | `Header.tsx` has no user context |
| U2 | No loading skeletons | All components |
| U3 | Configurator canvas is static demo only | `Configurator.tsx:121-184` |

---

## Part 2: Database Schema Assessment

### Positive Findings
- Well-designed normalized schema with proper relationships
- Appropriate enums for type safety (`app_role`, `camera_status`, `alert_type`, etc.)
- Time-series index on `live_counts` for query performance
- RLS policies properly implemented with security definer functions
- Proper role-based access control structure in `user_roles` table
- Trigger for auto-creating profile + default role on signup

### Schema Gaps Identified
1. **Missing `counting_events` table** - For granular track-level deduplication
2. **Missing `hourly_stats` table** - For aggregated hourly analytics
3. **Missing `daily_stats` table** - For aggregated daily summaries
4. **Missing `audit_logs` table** - For user action tracking
5. **Missing `system_settings` table** - For persistent configuration
6. **Missing `created_by` fields** - For accountability tracking

---

## Part 3: Implementation Plan

### Phase 1: Core Authentication & Authorization

**1.1 Create Auth Context**
Create `src/contexts/AuthContext.tsx`:
- Session state management with `useState`
- User profile and role fetching
- `onAuthStateChange` listener for session persistence
- Loading state during auth check
- Logout function

**1.2 Create Protected Route Component**
Create `src/components/auth/ProtectedRoute.tsx`:
- Wraps all authenticated routes
- Redirects to `/auth` if not logged in
- Shows loading spinner during auth check

**1.3 Create Role Guard Component**
Create `src/components/auth/RoleGuard.tsx`:
- Checks user role against required permissions
- Shows "Access Denied" for unauthorized users
- Configurable for admin-only, operator+, etc.

**1.4 Fix Auth Page**
Update `Auth.tsx`:
- Remove demo login functionality entirely (security risk)
- Add proper error handling for auth failures
- Implement password strength validation with zod
- Add loading state during auth operations

**1.5 Add Session UI**
Update `Sidebar.tsx`:
- Add user profile section at bottom showing name/email
- Implement logout button with actual signOut call
- Display current user role badge

---

### Phase 2: Data Layer & React Query Hooks

**2.1 Create Data Fetching Hooks**

```text
src/hooks/
  use-auth.ts           - Auth state & operations
  use-cameras.ts        - Camera CRUD & status queries
  use-sites.ts          - Site management
  use-zones.ts          - Zone management
  use-live-counts.ts    - Real-time counting data
  use-alerts.ts         - Alert management & acknowledgment
  use-reports.ts        - Report generation & export
  use-user-role.ts      - Current user role check
  use-recorded-jobs.ts  - Video processing jobs
  use-realtime.ts       - Realtime subscriptions
```

**2.2 Implement Supabase Queries**
For each hook:
- Replace all mock arrays with database queries
- Add optimistic updates for mutations
- Implement error handling with toast notifications
- Add loading states

**2.3 Real-time Subscriptions**
Migration to enable realtime:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE live_counts;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE cameras;
ALTER PUBLICATION supabase_realtime ADD TABLE recorded_jobs;
```

Create subscription hooks for:
- Live count updates (dashboard, monitoring)
- New alerts (header notification badge)
- Camera status changes
- Job progress updates

---

### Phase 3: Database Enhancements

**3.1 New Tables Migration**

```sql
-- Granular counting events for deduplication
CREATE TABLE counting_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID REFERENCES cameras(id) ON DELETE CASCADE NOT NULL,
  track_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  line_id TEXT,
  zone_id UUID REFERENCES zones(id),
  confidence FLOAT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  UNIQUE(camera_id, track_id, direction, DATE(timestamp))
);

-- Hourly aggregated stats
CREATE TABLE hourly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID REFERENCES cameras(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id),
  zone_id UUID REFERENCES zones(id),
  hour_start TIMESTAMPTZ NOT NULL,
  total_in INTEGER DEFAULT 0,
  total_out INTEGER DEFAULT 0,
  peak_occupancy INTEGER DEFAULT 0,
  avg_dwell_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily aggregated stats
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID REFERENCES cameras(id),
  site_id UUID REFERENCES sites(id),
  date DATE NOT NULL,
  total_in INTEGER DEFAULT 0,
  total_out INTEGER DEFAULT 0,
  peak_occupancy INTEGER DEFAULT 0,
  peak_time TIMESTAMPTZ,
  avg_dwell_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit logs for user actions
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- System settings
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
```

**3.2 Seed Initial Data**
```sql
-- Insert demo site
INSERT INTO sites (name, address, timezone) VALUES
('Main Campus', '123 Enterprise Way', 'America/New_York');

-- Insert demo zones
INSERT INTO zones (site_id, name, max_occupancy) 
SELECT id, 'Main Entrance', 200 FROM sites WHERE name = 'Main Campus'
UNION ALL
SELECT id, 'Conference Hall', 100 FROM sites WHERE name = 'Main Campus'
UNION ALL
SELECT id, 'Cafeteria', 150 FROM sites WHERE name = 'Main Campus';

-- Insert demo cameras
INSERT INTO cameras (name, site_id, zone_id, rtsp_url, status, enabled) 
SELECT s.id as site_id, 'Main Entrance Cam', z.id as zone_id, 
       'rtsp://demo:demo@192.168.1.100:554/stream1', 'offline', true
FROM sites s
JOIN zones z ON z.site_id = s.id AND z.name = 'Main Entrance'
WHERE s.name = 'Main Campus';
```

---

### Phase 4: Camera Management (Full CRUD)

**4.1 Update Cameras.tsx**
- Replace `mockCameras` array with `useCameras()` hook
- Implement `addCamera` mutation with database insert
- Implement `updateCamera` mutation
- Implement `deleteCamera` with confirmation dialog
- Add RTSP URL validation using zod
- Calculate stats dynamically from database counts

**4.2 Create test-rtsp-connection Edge Function**
```text
supabase/functions/test-rtsp-connection/index.ts
```
- Accept RTSP URL
- Validate URL format
- Return success/failure status
- (Note: Actual RTSP testing requires external service)

**4.3 Camera Enable/Disable**
- Wire up Switch component to database update
- Show toast on success/failure

---

### Phase 5: Interactive Configurator

**5.1 Create Drawing Canvas Component**
Create `src/components/configurator/DrawingCanvas.tsx`:
- SVG-based interactive canvas
- Mouse event handlers for drawing
- Support for:
  - ROI polygon drawing (click to add points, double-click to close)
  - Counting line drawing with direction arrows
  - Zone polygon drawing
- Point editing (drag to adjust vertices)
- Delete selected element

**5.2 Create Configuration State Management**
Create `src/hooks/use-configurator.ts`:
- Local state for current drawing
- Undo/redo stack
- Save to `camera_configs` table
- Load existing config on camera selection
- Version incrementing on save

**5.3 Update Configurator Page**
Update `Configurator.tsx`:
- Fetch cameras from database for dropdown
- Load camera snapshot as canvas background (or placeholder)
- Integrate DrawingCanvas component
- Wire up Save button to persist configuration
- Show loading states

---

### Phase 6: Real-time Dashboard

**6.1 Update Dashboard.tsx**
- Replace all `mockCameras` with real data
- Subscribe to `live_counts` changes
- Calculate current occupancy per camera/zone
- Auto-refresh every 10 seconds as fallback

**6.2 Update Chart Components**
Update `OccupancyChart.tsx` and `InOutChart.tsx`:
- Accept data as props instead of using mock
- Fetch time-series data from `live_counts`
- Implement time range selection (Today, Last 7 days, etc.)

**6.3 Update CameraWidget**
- Accept camera object as prop
- Show real occupancy from latest `live_counts` entry
- Display actual IN/OUT statistics

**6.4 Update AlertsList**
- Fetch from `alerts` table
- Subscribe to new alerts
- Implement acknowledge action

---

### Phase 7: Video Upload & Processing

**7.1 Create Storage Bucket**
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('video-uploads', 'video-uploads', false);

-- RLS for uploads
CREATE POLICY "Admins/operators can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'video-uploads' AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operator'))
);

CREATE POLICY "Authenticated can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'video-uploads');
```

**7.2 Create process-video Edge Function**
Create `supabase/functions/process-video/index.ts`:
- Accept job ID
- Update job status to "processing"
- Call Lovable AI (google/gemini-2.5-flash) for video analysis
- Use tool calling to extract structured output:
  ```json
  {
    "totalIn": 150,
    "totalOut": 142,
    "peakOccupancy": 45,
    "avgDwellSeconds": 180,
    "confidence": 0.92
  }
  ```
- Update job with results
- Handle errors gracefully

**7.3 Update RecordedAnalysis.tsx**
- Implement drag-and-drop file upload
- Upload to storage bucket with progress
- Create job record in `recorded_jobs`
- Call process-video edge function
- Subscribe to job progress updates
- Display results when complete
- Implement view/download/delete actions

---

### Phase 8: Edge Functions Suite

**8.1 Core Edge Functions to Create**

```text
supabase/functions/
  process-video/index.ts      - Video processing with AI
  ingest-count/index.ts       - Accept counting data from external workers
  generate-report/index.ts    - Create PDF/CSV reports
  aggregate-stats/index.ts    - Hourly/daily aggregation (cron)
```

**8.2 ingest-count Edge Function**
- Accept authenticated POST with:
  - camera_id, track_id, direction, timestamp, confidence
- Validate data integrity
- Check for duplicates using track_id
- Insert into `counting_events`
- Update `live_counts` aggregate
- Check threshold alerts

**8.3 generate-report Edge Function**
- Accept date range, camera/site filters
- Query aggregated data
- Generate CSV or PDF summary
- Return download URL

---

### Phase 9: Alerts System

**9.1 Update Alerts.tsx**
- Fetch alerts from database
- Implement real-time subscription
- Wire up acknowledge/close buttons to mutations
- Implement bulk actions

**9.2 Alert Rules Management**
- CRUD for alert rules
- Threshold configuration UI
- Email notification toggle

**9.3 Toast Notifications**
- Show toast when new critical alert arrives
- Sound notification option in settings

---

### Phase 10: Reports & Export

**10.1 Update Reports.tsx**
- Generate reports from real data
- Query `hourly_stats` and `daily_stats`
- Calculate totals, peaks, averages

**10.2 Export Functionality**
- CSV export: Use client-side library
- PDF export: Call generate-report edge function
- Download management

---

### Phase 11: Settings & Administration

**11.1 Update Settings.tsx**
- Create `system_settings` table entries
- Save/load all settings from database
- Apply settings in real-time

**11.2 User Management Page**
Create `src/pages/UserManagement.tsx`:
- Admin-only access
- View all users with roles
- Assign/change user roles
- User activity log

---

### Phase 12: Production Hardening

**12.1 Error Handling**
- Add ErrorBoundary at route level
- Implement retry logic for failed requests
- Offline detection with reconnection handling

**12.2 Performance**
- Add pagination to all tables (20 items default)
- Implement cursor-based pagination for large datasets
- Add debouncing to search inputs

**12.3 Mobile Responsiveness**
- Make sidebar collapsible/drawer on mobile
- Touch-friendly interactions
- Test all breakpoints

---

## Part 4: People Counting Accuracy Logic

### Deduplication Strategy

The `counting_events` table with unique constraint ensures no double counting:

```sql
UNIQUE(camera_id, track_id, direction, DATE(timestamp))
```

Each person crossing a counting line gets a unique `track_id` from the CV system. Even if the same person crosses multiple times or is detected multiple times, only one event per direction per day is recorded.

### Occupancy Calculation

```sql
-- Current occupancy for a camera
SELECT 
  SUM(in_count) - SUM(out_count) as current_occupancy
FROM live_counts
WHERE camera_id = $1 
  AND timestamp >= CURRENT_DATE;

-- Zone occupancy
SELECT 
  SUM(CASE WHEN direction = 'in' THEN 1 ELSE 0 END) -
  SUM(CASE WHEN direction = 'out' THEN 1 ELSE 0 END) as zone_occupancy
FROM counting_events
WHERE zone_id = $1 
  AND timestamp >= CURRENT_DATE;
```

### Integration with External CV Workers

The `ingest-count` edge function provides an API for external computer vision workers:

```text
POST /functions/v1/ingest-count
Authorization: Bearer <service_role_key>

{
  "camera_id": "uuid",
  "track_id": "person_123",
  "direction": "in",
  "line_id": "main_entrance_line",
  "confidence": 0.95,
  "timestamp": "2024-01-15T14:32:00Z"
}
```

---

## Part 5: Files to Create/Modify

### New Files

```text
src/
  contexts/
    AuthContext.tsx              - Global auth state
  hooks/
    use-auth.ts                  - Auth operations
    use-cameras.ts               - Camera queries
    use-sites.ts                 - Site queries
    use-zones.ts                 - Zone queries
    use-live-counts.ts           - Counting data
    use-alerts.ts                - Alert queries
    use-reports.ts               - Report generation
    use-user-role.ts             - Role checking
    use-realtime.ts              - Realtime subscriptions
    use-recorded-jobs.ts         - Video job management
    use-configurator.ts          - Configurator state
  components/
    auth/
      ProtectedRoute.tsx         - Auth guard
      RoleGuard.tsx              - Permission guard
    configurator/
      DrawingCanvas.tsx          - Interactive SVG drawing
    common/
      LoadingSpinner.tsx         - Loading state
      EmptyState.tsx             - Empty data state
      ErrorBoundary.tsx          - Error catching
      DataTable.tsx              - Reusable table with pagination
    layout/
      UserMenu.tsx               - Profile dropdown
  pages/
    UserManagement.tsx           - Admin user management

supabase/functions/
  process-video/index.ts         - Video processing
  ingest-count/index.ts          - Count ingestion endpoint
  generate-report/index.ts       - Report generation
  aggregate-stats/index.ts       - Cron aggregation
```

### Modified Files

```text
src/App.tsx                      - Add AuthProvider, ProtectedRoute
src/pages/Auth.tsx               - Remove demo login, add validation
src/pages/Dashboard.tsx          - Replace mock data with hooks
src/pages/Cameras.tsx            - Full CRUD implementation
src/pages/Configurator.tsx       - Interactive drawing
src/pages/LiveMonitoring.tsx     - Real data + realtime
src/pages/RecordedAnalysis.tsx   - Video upload + processing
src/pages/Alerts.tsx             - Database integration
src/pages/Reports.tsx            - Real report generation
src/pages/Settings.tsx           - Persistent settings
src/components/layout/Sidebar.tsx - User profile, logout
src/components/dashboard/*.tsx   - Real data props
supabase/config.toml             - Add function configs
```

---

## Part 6: Implementation Timeline

### Week 1: Foundation
1. Auth context & protected routes
2. Remove demo login entirely
3. Create all data hooks (initial implementations)
4. Add loading/error states
5. Seed database with initial data

### Week 2: Core Data
1. Implement camera CRUD with database
2. Implement sites/zones management
3. Replace all mock data with real queries
4. Add form validation with zod

### Week 3: Real-time & Configurator
1. Set up realtime subscriptions
2. Implement interactive configurator canvas
3. Save/load configurations
4. Dynamic dashboard updates

### Week 4: Backend Processing
1. Create process-video edge function
2. Create ingest-count edge function
3. Create aggregate-stats cron job
4. Implement alert triggering
5. Video upload and processing flow

### Week 5: Reports & Polish
1. Report generation with real data
2. CSV/PDF export functionality
3. Mobile responsiveness fixes
4. Performance optimization
5. Final testing and bug fixes

---

## Success Criteria

| Criteria | Description |
|----------|-------------|
| Authentication | Users must log in to access any page |
| Authorization | Role-based access enforced on all operations |
| Data Integrity | Zero mock/demo data in production |
| Real-time | Dashboard updates within 2 seconds of data change |
| Accuracy | Counting events deduplicated by track_id |
| Reliability | Error handling on all operations |
| Auditability | All sensitive actions logged |
| Performance | Page load under 2 seconds, table pagination |
| Export | Working CSV/PDF report generation |
| Mobile | Fully responsive on tablet/mobile |
| Video Processing | Upload, process, and display results |
