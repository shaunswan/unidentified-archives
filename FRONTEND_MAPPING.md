# Frontend to Repository File Mapping

## Architecture Overview

**Frontend Framework**: React (TanStack Router + TanStack Query)
**Data Source**: `src/data/cases.json`
**Repository**: `/repository/` directory

The frontend displays declassified UAP (Unidentified Aerial Phenomena) documents organized into 9 cases with 23 total incidents and 197 files.

---

## Directory Structure

```
src/
├── assets/
│   └── hero-uap.jpg          # Hero image for homepage
├── components/
│   ├── CaseCard.tsx          # Card component for case listings
│   ├── FilePreview.tsx       # Document/video preview component
│   ├── SiteHeader.tsx        # Navigation header
│   └── ui/                   # Shadcn UI components library
├── data/
│   └── cases.json            # Master data file (maps to repository)
├── hooks/
│   └── use-mobile.tsx        # Responsive design hook
├── lib/
│   ├── cases.ts              # Cases data loader & utilities
│   ├── error-capture.ts      # Error handling
│   ├── error-page.ts         # Error page component
│   └── utils.ts              # Utility functions
├── routes/
│   ├── __root.tsx            # Root layout
│   ├── index.tsx             # Homepage (case list view)
│   ├── about.tsx             # About page
│   ├── cases.$caseId.tsx     # Case detail view
│   ├── cases.$caseId.episodes.$episodeId.tsx  # Episode/document detail view
│   └── timeline.tsx          # Timeline view
├── router.tsx                # Router configuration
└── server.ts & start.ts      # Server entry points
```

---

## Route Mapping

### 1. **Homepage** → `src/routes/index.tsx`
- **URL**: `/`
- **Component**: `Index` (displays newspaper-style masthead)
- **Data Source**: `src/data/cases.json` (metadata + all 9 cases)
- **Repository Files**: None directly used (this is the entry point)
- **Purpose**: Lists all case cards in "The UAP Gazette" newspaper format

### 2. **Case List View** → `src/routes/index.tsx`
- **URL**: `/`
- **Displays**: `CaseCard` components for each case
- **Cases Displayed**:
  - CASE-001: Initial UAP Assessment & Composites
  - CASE-002: Middle East Operations Campaign
  - CASE-003: Cold War Era Diplomatic Cables
  - CASE-004: NASA Apollo & Skylab Missions
  - CASE-005: Western United States Field Investigation
  - CASE-006: Witness Statements & Serial Documentation
  - CASE-007: Western US Regional Event Summary
  - CASE-008: DOD Video Evidence Archive
  - CASE-009: Summary & Overview

### 3. **Case Detail View** → `src/routes/cases.$caseId.tsx`
- **URL**: `/cases/:caseId`
- **Parameters**: `caseId` (e.g., `CASE-001`, `CASE-002`)
- **Component**: Displays case metadata and lists episodes
- **Data Source**: `src/data/cases.json` → cases[].caseId
- **Example**: `/cases/CASE-002` → Middle East Operations Campaign

### 4. **Episode Detail View** → `src/routes/cases.$caseId.episodes.$episodeId.tsx`
- **URL**: `/cases/:caseId/episodes/:episodeId`
- **Parameters**: `caseId` and `episodeId`
- **Component**: `FilePreview` - displays documents, images, or videos
- **Data Source**: 
  - `src/data/cases.json` → cases[].episodes[].files[]
  - Maps episode to repository files
- **Example**: `/cases/CASE-002/episodes/EP-002-03` → Arabian Gulf Operations (July 2020)

### 5. **Timeline View** → `src/routes/timeline.tsx`
- **URL**: `/timeline`
- **Data Source**: `src/data/cases.json` (chronological sorting)
- **Purpose**: Displays all incidents chronologically

### 6. **About Page** → `src/routes/about.tsx`
- **URL**: `/about`
- **Static content**: Information about the dataset

---

## Cases to Repository Mapping

### CASE-001: Initial UAP Assessment & Composites
**Episodes**: 4 episodes
| Episode ID | Title | Repository Path |
|-----------|-------|-----------------|
| EP-001-01 | Initial Report 11 | `01_Initial_Reports/059uap00011.pdf` |
| EP-001-02 | Initial Report 12 | `01_Initial_Reports/059uap00012.pdf` |
| EP-001-03 | Initial Report 13 | `01_Initial_Reports/059uap00013.pdf` |
| EP-001-04 | Composite Sketch (April 2024) | `01_Initial_Reports/2024-04-30-composite-sketch.pdf` |

### CASE-002: Middle East Operations Campaign
**Episodes**: 10 episodes (2000-2025 operations)
| Episode ID | Title | Primary Repository Path |
|-----------|-------|------------------------|
| EP-002-01 | Launch Summary (2000) | `02_Military_Documents/dow-uap-d49-*.pdf` |
| EP-002-02 | Syria Operations (Nov 2016) | `02_Military_Documents/dow-uap-d55-*.pdf` |
| EP-002-03 | Arabian Gulf Operations (Jul 2020) | `02_Military_Documents/dow-uap-d5-d6-d7-*.pdf` |
| EP-002-04 | Persian Gulf Region (Aug 2020) | `02_Military_Documents/dow-uap-d60-d61-*.pdf` |
| EP-002-05 | Strait of Hormuz Incidents (Sep-Oct 2020) | `02_Military_Documents/dow-uap-d62-d63-*.pdf` |
| EP-002-06 | Iran Border Incident (Nov 2020) | `02_Military_Documents/dow-uap-d64-*.pdf` |
| EP-002-07 | Mediterranean Operations | `02_Military_Documents/dow-uap-d54-d74-*.pdf` |
| EP-002-08 | Gulf of Aden Incidents | `02_Military_Documents/dow-uap-d57-d75-*.pdf` |
| EP-002-09 | Range Fouler Incidents | `02_Military_Documents/dow-uap-d56-d58-*.pdf` |
| EP-002-10 | Recent Communications (2023-2025) | `02_Military_Documents/dow-uap-d50-d51-d52-*.pdf` |

### CASE-003: Cold War Era Diplomatic Cables
**Episodes**: 2 episodes
| Episode ID | Title | Repository Path |
|-----------|-------|-----------------|
| EP-003-01 | Papua New Guinea Incident (Jan 1985) | `02_Military_Documents/dos-uap-d1-*.pdf` |
| EP-003-02 | Kazakhstan Incident (Jan 1994) | `02_Military_Documents/dos-uap-d2-*.pdf` |

### CASE-004: NASA Apollo & Skylab Missions
**Episodes**: 6 episodes (1969-1973)
| Episode ID | Title | Repository Path |
|-----------|-------|-----------------|
| EP-004-01 | Apollo 11/12 Technical Debriefing | `03_NASA_Documents/nasa-uap-d1-*.pdf` |
| EP-004-02 | Apollo 12 Technical Debriefing | `03_NASA_Documents/nasa-uap-d2-*.pdf` |
| EP-004-03 | Apollo Mission Debriefings | `03_NASA_Documents/nasa-uap-d4-d5-*.pdf` |
| EP-004-04 | Skylab Program Documentation | `03_NASA_Documents/nasa-uap-d6-d7-*.pdf` |
| EP-004-05 | Apollo 12 Video Evidence (1969) | `03_NASA_Documents/nasa-uap-vm1-vm2-*.jpg` |
| EP-004-06 | Apollo 17 Lunar Anomalies (1972) | `03_NASA_Documents/nasa-uap-vm3-vm6-*.jpg` |

### CASE-005: Western United States Field Investigation
**Episodes**: 2 episodes (24 photographic incidents)
| Episode ID | Title | Repository Path |
|-----------|-------|-----------------|
| EP-005-01 | Photographic Evidence Series (Dec 2025) | `04_Field_Images/fbi-photo-a*.png` (16 images) |
| EP-005-02 | Photographic Analysis Reports | `04_Field_Images/fbi-photo-b*.pdf` (24 reports) |

### CASE-006: Witness Statements & Serial Documentation
**Episodes**: 4 episodes
| Episode ID | Title | Repository Path |
|-----------|-------|-----------------|
| EP-006-01 | Serial #3 Documentation | `05_User_Statements/serial-3_redacted.pdf` |
| EP-006-02 | Serial #4 Documentation | `05_User_Statements/serial-4-redacted_redacted.pdf` |
| EP-006-03 | Serial #5 Documentation | `05_User_Statements/serial 5 redacted_redacted.pdf` |
| EP-006-04 | Eyewitness Statement | `05_User_Statements/usper-statement-redacted.pdf` |

### CASE-007: Western US Regional Event Summary
**Episodes**: 1 episode
| Episode ID | Title | Repository Path |
|-----------|-------|-----------------|
| EP-007-01 | Event Slides & Summary Presentation | `06_Event_Slides/western_us_event_slides_5.08.2026.pdf` |

### CASE-008: DOD Video Evidence Archive
**Episodes**: 1 episode (28 videos)
| Episode ID | Title | Repository Path |
|-----------|-------|-----------------|
| EP-008-01 | DOD UAP Video Evidence Collection | `07_Videos/DOD_*.mp4` (28 video files) |

### CASE-009: Summary & Overview
**Episodes**: Index files
| Episode ID | Title | Repository Path |
|-----------|-------|-----------------|
| (Index) | Comprehensive Index | `INDEX.md`, `CASE_DATABASE.json` |

---

## Repository Directory Structure

```
repository/
├── 01_Initial_Reports/          # Early UAP documentation
│   ├── 059uap00011.pdf
│   ├── 059uap00012.pdf
│   ├── 059uap00013.pdf
│   └── 2024-04-30-composite-sketch.pdf
├── 02_Military_Documents/       # DOW & DOS documents (main bulk)
│   ├── dow-uap-d*.pdf           # Department of War documents (d1-d75)
│   ├── dos-uap-d*.pdf           # State Department cables
│   └── ...
├── 03_NASA_Documents/           # Apollo & Skylab documentation
│   ├── nasa-uap-d*.pdf          # Technical debriefings
│   └── nasa-uap-vm*.jpg         # Mission video stills
├── 04_Field_Images/             # FBI photographic evidence
│   ├── fbi-photo-a*.png         # Thermal/infrared images
│   └── fbi-photo-b*.pdf         # Analysis reports
├── 05_User_Statements/          # Witness documentation (redacted)
│   ├── serial-*.pdf
│   └── usper-statement-*.pdf
├── 06_Event_Slides/             # Presentation materials
│   └── western_us_event_slides_*.pdf
├── 07_Videos/                   # Video evidence archive
│   └── DOD_*.mp4                # Military operation footage
├── 08_Images/                   # Additional image assets
├── CASE_ANALYSIS.txt            # Metadata
├── CASE_DATABASE.json           # Raw data (legacy)
└── INDEX.md                     # Documentation
```

---

## Data Flow

```
User navigates to /
    ↓
index.tsx loads from src/data/cases.json
    ↓
Displays case cards with CaseCard.tsx component
    ↓
User clicks on case (e.g., CASE-002)
    ↓
Routes to /cases/CASE-002
    ↓
cases.$caseId.tsx loads episode list for that case
    ↓
User clicks on episode (e.g., EP-002-03)
    ↓
Routes to /cases/CASE-002/episodes/EP-002-03
    ↓
FilePreview.tsx displays files from repository:
    - 02_Military_Documents/dow-uap-d5-*.pdf
    - 02_Military_Documents/dow-uap-d6-*.pdf
    - 02_Military_Documents/dow-uap-d7-*.pdf
```

---

## Key Components

### `src/components/CaseCard.tsx`
- Displays case summary cards
- Links to `/cases/:caseId`
- Shows case title, type, description, year/date range

### `src/components/FilePreview.tsx`
- Renders PDFs, images, and videos
- Maps file paths from cases.json to repository files
- Supports embedding and external preview

### `src/lib/cases.ts`
- Imports and exports `src/data/cases.json`
- Provides utilities for accessing cases, episodes, and files
- Used by route handlers to fetch data

### `src/components/SiteHeader.tsx`
- Navigation header with links to:
  - Home (`/`)
  - Timeline (`/timeline`)
  - About (`/about`)

---

## File Type Handling

| Type | Extension | Component | Example Repository Path |
|------|-----------|-----------|------------------------|
| Document | `.pdf` | PDF Viewer | `02_Military_Documents/dow-uap-d5-*.pdf` |
| Image | `.png`, `.jpg` | Image Preview | `04_Field_Images/fbi-photo-a*.png` |
| Video | `.mp4` | Video Player | `07_Videos/DOD_*.mp4` |

---

## Summary Statistics

- **Total Cases**: 9
- **Total Episodes**: 23
- **Total Files in Repository**: 197+
- **Organizations**: DOD, NASA, FBI, State Department
- **Date Range**: 1969-2026
- **Primary Document Type**: Military/Government Reports (PDFs)

---

## Notes

1. **File Duplicates**: Many files have duplicates (e.g., `file.pdf` and `file (1).pdf`) - these appear to be archival copies
2. **Redacted Documents**: Witness statements and some documents are marked as "redacted"
3. **Dynamic Routes**: The frontend uses TanStack Router's dynamic route segments (`$caseId`, `$episodeId`) to create URLs based on case/episode IDs
4. **No Backend API**: Files are served directly from the repository directory via static file serving
