

## Understanding the Issue

The current video analysis system produces **inconsistent counting results** because:

1. **No Real Video Processing**: The `process-video` edge function uses AI text prompts to "estimate" counts based on the video filename - it doesn't actually analyze video frames
2. **Random Fallback Values**: When no API key is available, it generates completely random numbers
3. **Counting Lines Not Used**: Although you can draw lines in the Configurator, they're stored but never applied to actual video analysis

## What You Need for Accurate Counting

To achieve **100% accurate counting**, you need a **Computer Vision (CV) pipeline** that:
1. Extracts frames from uploaded videos
2. Detects people using object detection (YOLO, etc.)
3. Tracks individuals across frames
4. Counts crossings over your drawn counting line

This requires **external CV processing** (Python-based ML backend with OpenCV, YOLO, DeepSORT) which is beyond what the current AI text-based approach can deliver.

## Proposed Solution: Proper Line-Based Counting Workflow

I can implement improvements to make the Configurator fully functional and prepare the system for CV integration:

### Phase 1: Enhanced Configurator Experience
- **Drawing Counting Lines**: Navigate to `/configurator`, select a camera, click the "Line" tool (arrow icon), then click two points to draw a line
- **Line Direction**: Each line shows an arrow indicating "IN" direction (configurable)
- **Save Configuration**: Click "Save Config" to persist lines to the database

### Phase 2: Video Upload with Line Association
- When uploading videos, select a camera configuration to apply that camera's counting lines
- The system will store the line definitions with the job for future CV processing

### Phase 3: Placeholder for Real CV Backend
- Update the edge function to clearly indicate when real CV is not available
- Return consistent "demo mode" results with a warning that real CV is needed
- Document the API contract for integrating an external CV service

## How to Draw a Counting Line (Current System)

1. **Go to Configurator**: Navigate to `/configurator` in the sidebar
2. **Select Camera**: Choose a camera from the dropdown (or add one in Cameras page first)
3. **Select Line Tool**: Click the arrow icon (`<->`) in the toolbar
4. **Draw Line**: Click once for start point, click again for end point
5. **Save**: Click "Save Config" to persist

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/process-video/index.ts` | Include line configuration in AI prompts, add demo mode warnings, remove random variance |
| `src/pages/RecordedAnalysis.tsx` | Show warning when no camera config selected, display line count being used |
| `src/pages/Configurator.tsx` | Add help tooltips explaining how to draw lines |

### Database Already Supports This
The `camera_configs` table already stores:
- `line_json`: Array of counting lines with start/end coordinates and direction
- `roi_json`: Region of interest polygons
- `zone_json`: Zone definitions

### Edge Function Changes

```text
Current Flow:
  Upload Video -> Call AI with filename -> Random estimates

Proposed Flow:
  Upload Video -> Load camera config -> Pass line definitions to AI prompt 
  -> Return consistent results with "demo mode" indicator
```

### Important Limitations

For **production-accurate counting**, you'll need to integrate an external CV service that:
1. Accepts video files
2. Runs YOLO/DeepSORT detection and tracking
3. Uses line coordinates for crossing detection
4. Returns frame-accurate counts

This plan focuses on making the existing UI fully functional and preparing the system architecture for CV integration.

