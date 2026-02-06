
# Remove Demo Mode and Make App Production-Ready

## Summary

This plan removes all demo mode functionality, mock data generation, and test placeholders from the application, ensuring it operates as a full production system where all data comes from the database and AI vision processing.

---

## Identified Demo/Mock Data Locations

| Location | Issue | Action |
|----------|-------|--------|
| `supabase/functions/process-video/index.ts` | Demo mode with `seededRandom()` fake data when no API key | Remove demo fallback, require AI processing |
| `src/pages/Settings.tsx` | "Demo Mode" toggle in System Preferences | Remove the setting entirely |
| `src/hooks/use-settings.ts` | `demo_mode` in SystemSettings interface and defaults | Remove demo_mode property |
| `src/pages/RecordedAnalysis.tsx` | "demo mode" text references and UI labels | Update messaging to reflect production behavior |
| Edge function fallback | When AI fails, uses deterministic random values | Return error instead of fake data |

---

## Implementation Plan

### Phase 1: Remove Demo Mode Setting

**File: `src/hooks/use-settings.ts`**
- Remove `demo_mode` from `SystemSettings` interface
- Remove `demo_mode` from `defaultSettings` object

**File: `src/pages/Settings.tsx`**
- Remove "Demo Mode" toggle from System Preferences card
- Remove `demoMode` state variable
- Remove `demo_mode` from `handleSaveSystemPrefs`

---

### Phase 2: Update Edge Function for Production

**File: `supabase/functions/process-video/index.ts`**

Remove the demo mode fallback that generates fake data:

```text
Current behavior:
if (!lovableApiKey) {
  // Demo mode: Generate fake results
  const baseCount = Math.floor(seededRandom(40, 120));
  ...
}

New behavior:
if (!lovableApiKey) {
  // Return error - AI key required for production
  await supabase.from("recorded_jobs").update({
    status: "failed",
    error_message: "AI processing not configured. Contact administrator.",
  }).eq("id", jobId);

  return new Response(
    JSON.stringify({ error: "AI processing not configured" }),
    { status: 503, ... }
  );
}
```

Remove fallback random values when tool call fails:
```text
Current:
} else {
  result = {
    totalIn: Math.floor(seededRandom(50, 100)),
    ...
  };
}

New:
} else {
  throw new Error("AI did not return valid analysis results");
}
```

Remove `seededRandom` function entirely since it's only used for demo data.

Remove `isDemo` flag from results - all results are now real AI analysis.

---

### Phase 3: Update UI Messaging

**File: `src/pages/RecordedAnalysis.tsx`**

Update references to "demo mode":

| Current Text | New Text |
|-------------|----------|
| `"demo mode - no lines configured"` | `"AI estimation - no counting lines configured"` |
| `"No config (demo mode)"` | `"No configuration"` |
| `"demo mode with estimated results"` | `"AI estimation without counting lines"` |
| `result.isDemo ? "Demo Mode" : "AI Vision"` | `"AI Vision Analysis"` |

Remove the `isDemo` check since all results are from AI:
- Remove `isDemo?: boolean` from result type
- Update display to always show "AI Vision" label

---

### Phase 4: Remove Unused Demo Properties

**Database cleanup (optional)**

The `system_settings` table may contain a `demo_mode` key from previous usage. This is harmless but can be removed:

```sql
DELETE FROM system_settings WHERE key = 'demo_mode';
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/hooks/use-settings.ts` | Remove `demo_mode` property |
| `src/pages/Settings.tsx` | Remove Demo Mode toggle UI |
| `supabase/functions/process-video/index.ts` | Remove demo fallback, require real AI processing |
| `src/pages/RecordedAnalysis.tsx` | Update messaging, remove demo labels |

---

## Post-Implementation Behavior

| Scenario | Before (Demo Mode) | After (Production) |
|----------|-------------------|-------------------|
| No LOVABLE_API_KEY | Fake deterministic data | Error: "AI processing not configured" |
| AI returns no tool call | Fake fallback values | Error: Job fails with message |
| No counting lines | "Demo mode" label | "AI estimation" label |
| Results display | Shows "Demo Mode" vs "AI Vision" | Always shows "AI Vision Analysis" |

---

## Validation Steps

After implementation:
1. Upload a video with counting lines configured
2. Verify job processes with real AI analysis
3. Confirm results dialog shows "AI Vision Analysis" (no demo labels)
4. Verify Settings page no longer has "Demo Mode" toggle
5. Test error handling when AI processing fails (if possible to simulate)
