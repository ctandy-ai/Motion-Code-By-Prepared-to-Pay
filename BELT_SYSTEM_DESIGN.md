# 🥋 Belt/Level Progression System - Design & Testing Strategy

## Overview
A performance-based progression system that automatically promotes athletes through belt levels (White → Blue → Black) based on objective KPI test results. This creates clear performance benchmarks and motivation for athletes while giving coaches data-driven insights.

---

## System Architecture

### Core Components

```
┌─────────────────────┐
│   Test Results      │ ← Athletes complete performance tests
│   (Triple Hop, etc.)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   KPI Evaluation    │ ← Compare results to thresholds
│   Engine            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Auto-Promotion    │ ← Upgrade belt if thresholds met
│   Logic             │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Athlete Profile   │ ← Updated belt level displayed
│   + Badge           │
└─────────────────────┘
```

---

## Database Schema

### 1. Athlete Belt Level
```typescript
export const athletes = pgTable("athletes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  team: text("team"),
  position: text("position"),
  beltLevel: text("belt_level").notNull().default('white'),  // NEW FIELD
  avatarUrl: text("avatar_url"),
  dateJoined: timestamp("date_joined").defaultNow(),
});
```

**Belt Levels**: 
- `white` - Beginner
- `blue` - Intermediate  
- `black` - Advanced

---

### 2. Test Results Table
```typescript
export const testResults = pgTable("test_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull(),
  testType: text("test_type").notNull(), // 'triple_hop', 'linear_speed', 'cod'
  testDate: timestamp("test_date").defaultNow(),
  
  // Triple Hop specific
  rsiSymmetryPct: real("rsi_symmetry_pct"),  // % difference left vs right
  
  // Linear Speed specific
  sprintTime: real("sprint_time"),  // seconds (e.g., 40-yard dash)
  velocityMax: real("velocity_max"),  // m/s
  
  // Change of Direction (COD) specific
  proAgilityTime: real("pro_agility_time"),  // seconds
  lShuttleTime: real("l_shuttle_time"),  // seconds
  
  // Metadata
  notes: text("notes"),
  videoUrl: text("video_url"),
});
```

---

### 3. KPI Thresholds Table
```typescript
export const kpiThresholds = pgTable("kpi_thresholds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testType: text("test_type").notNull(),
  beltLevel: text("belt_level").notNull(),
  metricName: text("metric_name").notNull(),
  thresholdValue: real("threshold_value").notNull(),
  operator: text("operator").notNull(), // '<', '>', '<=', '>='
  description: text("description"),
});
```

**Example Seed Data**:
```javascript
// Triple Hop RSI Symmetry (lower % = better)
{ testType: 'triple_hop', beltLevel: 'black', metricName: 'rsi_symmetry_pct', thresholdValue: 7.0, operator: '<=' }
{ testType: 'triple_hop', beltLevel: 'blue', metricName: 'rsi_symmetry_pct', thresholdValue: 15.0, operator: '<=' }
// White belt = default (no threshold)

// Linear Speed (lower time = better)
{ testType: 'linear_speed', beltLevel: 'black', metricName: 'sprint_time', thresholdValue: 4.5, operator: '<=' }
{ testType: 'linear_speed', beltLevel: 'blue', metricName: 'sprint_time', thresholdValue: 5.0, operator: '<=' }

// COD Pro Agility (lower time = better)
{ testType: 'cod', beltLevel: 'black', metricName: 'pro_agility_time', thresholdValue: 4.2, operator: '<=' }
{ testType: 'cod', beltLevel: 'blue', metricName: 'pro_agility_time', thresholdValue: 4.8, operator: '<=' }
```

---

## Auto-Promotion Logic

### Rules:
1. **Upgrade Only** - Athletes can only move UP in belt levels, never down
2. **Multi-KPI Requirements** - Must pass ALL required tests for a belt level
3. **Most Recent Result** - Only the latest test result counts per test type
4. **Immediate Promotion** - Belt updates as soon as threshold is met

### Promotion Algorithm:
```typescript
async function evaluateBeltPromotion(athleteId: string) {
  const athlete = await storage.getAthlete(athleteId);
  const currentBelt = athlete.beltLevel;
  
  // Get most recent test results for each type
  const latestResults = await getLatestTestResults(athleteId);
  
  // Check Black belt requirements first (highest level)
  if (currentBelt !== 'black') {
    const meetsBlackRequirements = await checkBeltRequirements(latestResults, 'black');
    if (meetsBlackRequirements) {
      await storage.updateAthlete(athleteId, { beltLevel: 'black' });
      await createNotification(athleteId, 'Promoted to Black Belt! 🥋');
      return 'black';
    }
  }
  
  // Check Blue belt requirements
  if (currentBelt === 'white') {
    const meetsBlueRequirements = await checkBeltRequirements(latestResults, 'blue');
    if (meetsBlueRequirements) {
      await storage.updateAthlete(athleteId, { beltLevel: 'blue' });
      await createNotification(athleteId, 'Promoted to Blue Belt! 🥋');
      return 'blue';
    }
  }
  
  return currentBelt; // No promotion
}

async function checkBeltRequirements(results: TestResult[], targetBelt: string): Promise<boolean> {
  const thresholds = await storage.getKpiThresholds(targetBelt);
  
  // Group thresholds by test type
  const requiredTests = groupBy(thresholds, 'testType');
  
  for (const [testType, requirements] of Object.entries(requiredTests)) {
    const result = results.find(r => r.testType === testType);
    
    if (!result) {
      return false; // Missing required test
    }
    
    // Check all metrics for this test type
    for (const req of requirements) {
      const metricValue = result[req.metricName];
      if (!meetsThreshold(metricValue, req.thresholdValue, req.operator)) {
        return false;
      }
    }
  }
  
  return true; // Passed all requirements
}

function meetsThreshold(value: number, threshold: number, operator: string): boolean {
  switch (operator) {
    case '<=': return value <= threshold;
    case '<': return value < threshold;
    case '>=': return value >= threshold;
    case '>': return value > threshold;
    default: return false;
  }
}
```

---

## Test Types & Metrics

### 1. Triple Hop Test (Reactive Strength Index)
**Purpose**: Measure explosive power and limb symmetry  
**Equipment**: Force plates, measurement tape  
**Protocol**:
1. Athlete performs 3 consecutive hops on right leg
2. Athlete performs 3 consecutive hops on left leg
3. Measure RSI (flight time / ground contact time) for each leg
4. Calculate symmetry: `abs(RSI_left - RSI_right) / max(RSI_left, RSI_right) * 100`

**Thresholds**:
- Black Belt: ≤7% asymmetry (elite level)
- Blue Belt: ≤15% asymmetry (competitive level)
- White Belt: >15% asymmetry (developing)

---

### 2. Linear Speed Test (40-Yard Dash)
**Purpose**: Measure straight-line acceleration and max velocity  
**Equipment**: Timing gates, laser system  
**Protocol**:
1. Athlete starts from 3-point stance
2. Sprint 40 yards as fast as possible
3. Record total time and max velocity (m/s)

**Thresholds** (example for football):
- Black Belt: ≤4.5 seconds (elite)
- Blue Belt: ≤5.0 seconds (competitive)
- White Belt: >5.0 seconds (developing)

---

### 3. Change of Direction (Pro Agility)
**Purpose**: Measure lateral movement, deceleration, and re-acceleration  
**Equipment**: Cones, timing gates  
**Protocol**:
1. Start straddling middle line
2. Sprint 5 yards right, touch line
3. Sprint 10 yards left, touch line
4. Sprint 5 yards right, finish at start

**Thresholds** (example):
- Black Belt: ≤4.2 seconds (elite)
- Blue Belt: ≤4.8 seconds (competitive)
- White Belt: >4.8 seconds (developing)

---

## UI/UX Design

### Athlete Profile Card Enhancement
```tsx
<Card className="hover-elevate">
  <CardContent className="p-4">
    <div className="flex items-start gap-4">
      <Avatar className="h-16 w-16">
        <AvatarImage src={athlete.avatarUrl} />
        <AvatarFallback>{athlete.name[0]}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{athlete.name}</h3>
          <BeltBadge level={athlete.beltLevel} />
        </div>
        <p className="text-sm text-muted-foreground">{athlete.position} • {athlete.team}</p>
        
        {/* Mini progress tracker */}
        <div className="mt-2 space-y-1">
          <TestProgress type="Triple Hop" status="passed" />
          <TestProgress type="Linear Speed" status="pending" />
          <TestProgress type="COD" status="not_tested" />
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

### Belt Badge Component
```tsx
function BeltBadge({ level }: { level: 'white' | 'blue' | 'black' }) {
  const colors = {
    white: 'bg-gray-200 text-gray-800 border-gray-300',
    blue: 'bg-blue-500 text-white border-blue-600',
    black: 'bg-gray-900 text-white border-yellow-500', // Gold border for black belt
  };
  
  const icons = {
    white: '🥋',
    blue: '🥋',
    black: '🏆',
  };
  
  return (
    <Badge className={`${colors[level]} border-2`}>
      {icons[level]} {level.toUpperCase()}
    </Badge>
  );
}
```

### Testing Dashboard
```
┌──────────────────────────────────────────────────────────┐
│  Testing Dashboard                                       │
├──────────────────────────────────────────────────────────┤
│  [Select Athlete: Jordan Martinez ▼]  [Test Type: All ▼]│
│                                                          │
│  ┌─────────────────┬──────────────┬────────────────┐   │
│  │ Test Type       │ Latest Result│ Belt Requirement│   │
│  ├─────────────────┼──────────────┼────────────────┤   │
│  │ Triple Hop      │ 6.8% ✓       │ Black: ≤7%     │   │
│  │ Linear Speed    │ 5.2s ✗       │ Blue: ≤5.0s    │   │
│  │ COD Pro Agility │ Not tested   │ Blue: ≤4.8s    │   │
│  └─────────────────┴──────────────┴────────────────┘   │
│                                                          │
│  Current Belt: BLUE 🥋                                   │
│  Next Promotion: Complete Linear Speed (0.2s to go!)    │
│                                                          │
│  [+ Add New Test Result]                                │
└──────────────────────────────────────────────────────────┘
```

---

## Testing Strategy

### Unit Tests

#### 1. Threshold Evaluation Tests
```typescript
describe('KPI Threshold Evaluation', () => {
  test('should promote to black belt with 6.9% RSI symmetry', async () => {
    const result = await submitTestResult({
      athleteId: 'athlete-1',
      testType: 'triple_hop',
      rsiSymmetryPct: 6.9,
    });
    
    const athlete = await storage.getAthlete('athlete-1');
    expect(athlete.beltLevel).toBe('black');
  });
  
  test('should promote to blue belt with 12% RSI symmetry', async () => {
    const result = await submitTestResult({
      athleteId: 'athlete-2',
      testType: 'triple_hop',
      rsiSymmetryPct: 12,
    });
    
    const athlete = await storage.getAthlete('athlete-2');
    expect(athlete.beltLevel).toBe('blue');
  });
  
  test('should stay white belt with 22% RSI symmetry', async () => {
    const result = await submitTestResult({
      athleteId: 'athlete-3',
      testType: 'triple_hop',
      rsiSymmetryPct: 22,
    });
    
    const athlete = await storage.getAthlete('athlete-3');
    expect(athlete.beltLevel).toBe('white');
  });
});
```

#### 2. Multi-KPI Requirements Tests
```typescript
describe('Multi-KPI Belt Promotion', () => {
  test('should require BOTH Triple Hop AND Speed for black belt', async () => {
    // Pass Triple Hop only
    await submitTestResult({
      athleteId: 'athlete-4',
      testType: 'triple_hop',
      rsiSymmetryPct: 6.5,
    });
    
    let athlete = await storage.getAthlete('athlete-4');
    expect(athlete.beltLevel).toBe('blue'); // Not black yet
    
    // Now pass Speed test
    await submitTestResult({
      athleteId: 'athlete-4',
      testType: 'linear_speed',
      sprintTime: 4.4,
    });
    
    athlete = await storage.getAthlete('athlete-4');
    expect(athlete.beltLevel).toBe('black'); // Now promoted
  });
});
```

#### 3. Upgrade-Only Tests
```typescript
describe('Upgrade-Only Belt Logic', () => {
  test('should never downgrade belt level', async () => {
    // Start at black belt
    await storage.updateAthlete('athlete-5', { beltLevel: 'black' });
    
    // Submit poor test result
    await submitTestResult({
      athleteId: 'athlete-5',
      testType: 'triple_hop',
      rsiSymmetryPct: 25, // White belt level
    });
    
    const athlete = await storage.getAthlete('athlete-5');
    expect(athlete.beltLevel).toBe('black'); // Still black
  });
});
```

---

### Integration Tests

#### Test Workflow End-to-End
```typescript
describe('Complete Belt Progression Workflow', () => {
  test('athlete progresses from white to black', async () => {
    // Create new athlete (white belt by default)
    const athlete = await storage.createAthlete({
      name: 'Test Athlete',
      email: 'test@example.com',
    });
    expect(athlete.beltLevel).toBe('white');
    
    // Submit blue-level Triple Hop
    await submitTestResult({
      athleteId: athlete.id,
      testType: 'triple_hop',
      rsiSymmetryPct: 12,
    });
    let updated = await storage.getAthlete(athlete.id);
    expect(updated.beltLevel).toBe('blue');
    
    // Submit black-level Triple Hop
    await submitTestResult({
      athleteId: athlete.id,
      testType: 'triple_hop',
      rsiSymmetryPct: 6.5,
    });
    updated = await storage.getAthlete(athlete.id);
    expect(updated.beltLevel).toBe('black');
  });
});
```

---

### Manual QA Test Cases

#### QA Script (60 seconds)
```
Test Case 1: White Belt (Should Stay White)
1. Create athlete "QA Test 1"
2. Submit Triple Hop: rsi_symmetry_pct = 22
3. Verify: Belt = WHITE

Test Case 2: Blue Belt Promotion
1. Create athlete "QA Test 2"
2. Submit Triple Hop: rsi_symmetry_pct = 12
3. Verify: Belt = BLUE
4. Check notification: "Promoted to Blue Belt!"

Test Case 3: Black Belt Promotion
1. Create athlete "QA Test 3"
2. Submit Triple Hop: rsi_symmetry_pct = 6.9
3. Verify: Belt = BLACK
4. Check notification: "Promoted to Black Belt!"

Test Case 4: Edge Case (Exact Threshold)
1. Create athlete "QA Test 4"
2. Submit Triple Hop: rsi_symmetry_pct = 7.0 (exactly black threshold)
3. Verify: Belt = BLACK (inclusive <=)

Test Case 5: Multi-Test Requirements
1. Create athlete "QA Test 5"
2. Submit Triple Hop: 6.5% → Belt should be BLUE
3. Submit Linear Speed: 4.4s → Belt should be BLACK
4. Verify: Belt progression logged correctly
```

---

## Performance Considerations

### Database Indexing
```sql
CREATE INDEX idx_test_results_athlete_id ON test_results(athlete_id);
CREATE INDEX idx_test_results_test_type ON test_results(test_type);
CREATE INDEX idx_test_results_test_date ON test_results(test_date DESC);
CREATE INDEX idx_kpi_thresholds_lookup ON kpi_thresholds(test_type, belt_level);
```

### Caching Strategy
- **Belt thresholds**: Cache in memory (rarely change)
- **Athlete belt levels**: No cache (must be real-time)
- **Latest test results**: Cache per athlete with 5-min TTL

---

## Future Enhancements

### Phase 2 Features:
1. **Custom Thresholds per Sport/Position**
   - Linemen vs. Skill position athletes have different standards
   
2. **Belt Decay/Re-testing**
   - Require re-testing every 6 months to maintain belt
   
3. **Composite Scores**
   - Weighted average of multiple tests for single belt level
   
4. **Team Belt Distribution Dashboard**
   - Show % of team at each belt level
   - Identify weak areas (e.g., "40% of team failing COD tests")

5. **Historical Progression Chart**
   - Timeline showing when athlete earned each belt
   - Test result trends over time

---

## Implementation Checklist

### Backend (2-3 hours):
- [ ] Add `beltLevel` to athletes schema
- [ ] Create `testResults` table
- [ ] Create `kpiThresholds` table with seed data
- [ ] Implement auto-promotion logic in `submitTestResult` endpoint
- [ ] Add belt evaluation service
- [ ] Unit tests for threshold logic
- [ ] API endpoints for test submission

### Frontend (2-3 hours):
- [ ] BeltBadge component
- [ ] Testing Dashboard page
- [ ] Test submission form
- [ ] Athlete profile belt display
- [ ] Progress tracker UI
- [ ] Notification toast on promotion

### Testing (1 hour):
- [ ] Unit tests (threshold evaluation)
- [ ] Integration tests (end-to-end workflow)
- [ ] Manual QA (60-second test script)
- [ ] Edge case testing (exact thresholds, missing tests)

---

## Example API Usage

### Submit Test Result
```javascript
POST /api/test-results
{
  "athleteId": "123",
  "testType": "triple_hop",
  "testDate": "2024-11-05",
  "rsiSymmetryPct": 6.8,
  "notes": "Best performance yet!",
  "videoUrl": "https://..."
}

Response:
{
  "id": "test-456",
  "athleteId": "123",
  "testType": "triple_hop",
  "rsiSymmetryPct": 6.8,
  "beltPromotion": {
    "previousBelt": "blue",
    "newBelt": "black",
    "promoted": true,
    "message": "Congratulations! Promoted to Black Belt 🏆"
  }
}
```

### Get Athlete Test Summary
```javascript
GET /api/athletes/123/test-summary

Response:
{
  "athleteId": "123",
  "currentBelt": "black",
  "tests": [
    {
      "testType": "triple_hop",
      "latestResult": 6.8,
      "status": "passed",
      "requiredFor": {
        "blue": { threshold: 15, passed: true },
        "black": { threshold: 7, passed: true }
      }
    },
    {
      "testType": "linear_speed",
      "latestResult": null,
      "status": "not_tested",
      "requiredFor": {
        "blue": { threshold: 5.0, passed: false },
        "black": { threshold: 4.5, passed: false }
      }
    }
  ],
  "nextPromotion": null // Already at highest belt
}
```

---

## Summary

This belt system creates:
- **Clear Performance Standards** - Athletes know exactly what to achieve
- **Automatic Progression** - No manual intervention needed
- **Data-Driven Coaching** - Identify weak areas objectively
- **Athlete Motivation** - Visual progression (badges, notifications)
- **TeamBuildr Differentiation** - They don't have this feature

**Recommended Timeline**: 
- Backend: 3 hours
- Frontend: 3 hours
- Testing: 1 hour
- **Total: 7 hours** for full belt system implementation

Would you like me to start implementing after program templates are complete?
