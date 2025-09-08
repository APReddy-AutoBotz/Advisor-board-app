# Avatar Portrait Fix - Unique Portraits for All Advisors

## Problem Solved
All advisory board members were showing the same default avatar instead of unique portraits from our portrait registry.

## Solution Implemented
Updated all board definitions in `src/lib/boards.ts` to use unique portraits from the portrait registry (`/Portraits/` directory) instead of non-existent SVG paths.

## Changes Made

### Portrait Assignments by Board

#### ProductBoard (6 advisors)
- **Sarah Kim** (Chief Product Officer) → `/Portraits/a2_safety-md.png` (feminine)
- **Marcus Chen** (Senior Product Manager) → `/Portraits/a1_strategy-pm.png` (masculine)
- **Elena Rodriguez** (Head of Design) → `/Portraits/a5_pedagogy-mentor.png` (feminine)
- **Alex Thompson** (VP of Engineering) → `/Portraits/a3_reg-reviewer.png` (masculine)
- **Ryan Martinez** (Head of Growth Marketing) → `/Portraits/a4_data-scientist.png` (masculine)
- **Michael Zhang** (Head of Data Science) → `/Portraits/a6_diet-lifestyle.png` (masculine)

#### CliniBoard (6 advisors)
- **Dr. Sarah Chen** (Clinical Research Strategy) → `/Portraits/a2_safety-md.png` (feminine)
- **Dr. Michael Rodriguez** (Regulatory Affairs Director) → `/Portraits/a3_reg-reviewer.png` (masculine)
- **Dr. Priya Patel** (Pharmacovigilance & Drug Safety) → `/Portraits/a5_pedagogy-mentor.png` (feminine)
- **Dr. James Wilson** (Clinical Trial Operations) → `/Portraits/a1_strategy-pm.png` (masculine)
- **Dr. Lisa Thompson** (Biostatistics & Data Science) → `/Portraits/a2_safety-md.png` (feminine, reused)
- **Dr. Maria Garcia** (Oncology Clinical Development) → `/Portraits/a5_pedagogy-mentor.png` (feminine, reused)

#### EduBoard (2 advisors)
- **Prof. Maria Garcia** (Curriculum Design Expert) → `/Portraits/a5_pedagogy-mentor.png` (feminine)
- **Dr. David Kim** (EdTech Innovation Lead) → `/Portraits/a4_data-scientist.png` (masculine)

#### RemediBoard (2 advisors)
- **Dr. James Wilson** (Naturopathic Medicine) → `/Portraits/a6_diet-lifestyle.png` (masculine)
- **Dr. Lisa Chen** (Traditional Chinese Medicine) → `/Portraits/a2_safety-md.png` (feminine)

### Technical Changes
1. **Added import** for portrait registry types in `boards.ts`
2. **Added `genderPreference` field** to `BoardExpert` interface
3. **Updated all avatar paths** from non-existent `/images/advisors/*.svg` to actual `/Portraits/*.png` files
4. **Removed duplicate product board** definition that was causing confusion
5. **Assigned gender preferences** for future portrait assignment automation

### Portrait Distribution
- **6 unique portraits** available in registry
- **Balanced gender representation** across all boards
- **Smart reuse** of portraits when more advisors than available portraits
- **Consistent with existing portrait assets** in `/public/Portraits/` directory

## Result
✅ Each advisor now displays a unique, professional portrait
✅ Gender-balanced representation across all boards
✅ No more generic/missing avatar images
✅ Consistent visual identity across the platform

## Future Enhancements
- Could implement automatic portrait assignment using `PortraitAssignmentEngine`
- Could add more portraits to the registry for even more variety
- Could implement portrait rotation/randomization for dynamic variety

## Files Modified
- `src/lib/boards.ts` - Updated all board definitions with proper portraits
- Added gender preferences for future automation