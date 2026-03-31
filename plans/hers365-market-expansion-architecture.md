# H.E.R.S.365 Full Market Expansion - Technical Architecture

## Focus: Girls Flag Football + Recruiting

---

## Player Segments (Girls Flag Football Only)

| Segment         | Age   | Focus                      |
| --------------- | ----- | -------------------------- |
| **Youth**       | 6-12  | Development, local leagues |
| **High School** | 14-18 | College recruiting         |
| **College**     | 18-22 | Playing opportunities      |
| **Elite**       | 16+   | Top talent, NIL            |

---

## Key Features

1. **League Finder** - Find local girls flag football leagues
2. **Team Finder** - Connect with teams needing players
3. **Profile for Every Player** - All skill levels welcome
4. **Rankings** - Elite + State + Recreational tiers
5. **College Recruiting Hub** - Connect players with programs

---

## Database Schema

### New Tables

```typescript
// Player Segments & Skill Levels
export const playerSegments = pgTable("player_segments", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id),
  segment: text("segment"), // 'youth', 'high_school', 'college', 'elite'
  skillTier: text("skill_tier"), // 'beginner', 'intermediate', 'advanced', 'elite'
  ageGroup: text("age_group"),
});

// Leagues
export const leagues = pgTable("leagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type"), // 'recreational', 'travel', 'club', 'school'
  state: text("state"),
  city: text("city"),
  ageGroup: text("age_group"),
  skillLevel: text("skill_level"),
  isActive: boolean("is_active").default(true),
});

// Teams
export const expandedTeams = pgTable("expanded_teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  leagueId: integer("league_id").references(() => leagues.id),
  type: text("type"), // 'school', 'travel', 'recreational', 'club'
  state: text("state"),
  city: text("city"),
  ageGroup: text("age_group"),
  skillLevel: text("skill_level"),
  isRecruiting: boolean("is_recruiting").default(false),
});

// Team Memberships
export const teamMemberships = pgTable("team_memberships", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => expandedTeams.id),
  playerId: integer("player_id").references(() => players.id),
  role: text("role"), // 'player', 'captain', 'coach'
  status: text("status").default("active"),
});

// College Programs
export const collegePrograms = pgTable("college_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  conference: text("conference"),
  division: text("division"),
  state: text("state"),
  hasFlagFootball: boolean("has_flag_football").default(true),
  recruitingActive: boolean("recruiting_active").default(true),
  positionsWanted: json("positions_wanted"),
});

// Recruiting Connections
export const recruitingConnections = pgTable("recruiting_connections", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id),
  programId: integer("program_id").references(() => collegePrograms.id),
  status: text("status"), // 'interested', 'contacted', 'offered', 'committed'
  notes: text("notes"),
});

// Events (All Flag Football Events)
export const localEvents = pgTable("local_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type"), // 'tournament', 'camp', 'clinic', 'showcase', 'tryout'
  date: timestamp("date").notNull(),
  city: text("city"),
  state: text("state"),
  skillLevel: text("skill_level"),
  ageGroup: text("age_group"),
  registrationUrl: text("registration_url"),
  isRecruiting: boolean("is_recruiting").default(false),
});

// Recreational Rankings
export const recreationalRankings = pgTable("recreational_rankings", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id),
  rankingType: text("ranking_type"), // 'city', 'state', 'regional'
  ageGroup: text("age_group"),
  rank: integer("rank"),
  points: integer("points"),
});

// Privacy Settings
export const privacySettings = pgTable("privacy_settings", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .references(() => players.id)
    .unique(),
  profileVisibility: text("profile_visibility").default("public"),
  showInRankings: boolean("show_in_rankings").default(true),
  allowCoachesToContact: boolean("allow_coaches_to_contact").default(true),
});
```

### Updated Players Table

```typescript
export const players = pgTable("players", {
  // ... existing fields ...

  skillTier: text("skill_tier").default("beginner"),
  isRecreational: boolean("is_recreational").default(false),
  state: text("state"),
  city: text("city"),
  zipCode: text("zip_code"),
  birthYear: integer("birth_year"),
});
```

---

## API Endpoints

### League & Team

```
GET  /api/v1/leagues              - List leagues (filter by state/city/age)
GET  /api/v1/teams                - List teams
GET  /api/v1/teams/search         - Find teams needing players
POST /api/v1/teams/:id/join       - Join a team
```

### Recruiting

```
GET  /api/v1/college-programs     - List college programs
POST /api/v1/recruiting/connect   - Express interest in program
GET  /api/v1/recruiting/dashboard - Player's recruiting status
```

### Rankings

```
GET  /api/v1/rankings/elite       - Top 250 Elite
GET  /api/v1/rankings/state       - State rankings
GET  /api/v1/rankings/recreational - Recreational rankings
```

### Events

```
GET  /api/v1/events               - List all flag football events
GET  /api/v1/events/search       - Search events
```

---

## Implementation

### Phase 1 (Weeks 1-4)

- League Finder
- Team Finder
- Player segments and skill tiers

### Phase 2 (Weeks 5-8)

- College Programs directory
- Recruiting connections
- Recruiting dashboard

### Phase 3 (Weeks 9-12)

- State rankings
- Recreational rankings
- Privacy settings
