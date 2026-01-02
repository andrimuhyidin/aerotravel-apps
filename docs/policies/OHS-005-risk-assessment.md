# OHS-005: Risk Assessment

**Document ID:** OHS-005  
**Version:** 1.0  
**ISO Standard:** ISO 45001:2018 (Clause 6.1)

## Purpose
Systematically assess and control risks for all activities.

## When Risk Assessment Required
- **New trips/destinations**: Before first trip
- **Regular trips**: Annual review
- **After incidents**: Immediate reassessment
- **Process changes**: Before implementation
- **New equipment**: Before use

## Pre-Trip Risk Assessment

Mandatory before each trip start via Guide App.

### Assessment Factors
1. **Weather Conditions**
   - Wave height (meters)
   - Wind speed (km/h)
   - Visibility
   - Forecast

2. **Crew Readiness**
   - All crew present
   - Certifications valid
   - Medical fitness
   - Adequate rest

3. **Equipment Status**
   - Safety equipment complete
   - Engine condition
   - Communication devices working
   - Emergency equipment accessible

4. **Passenger Considerations**
   - Special needs identified
   - Medical conditions noted
   - Experience levels
   - Age distribution

### Risk Scoring

Formula: 
```
Risk Score = (Wave Height × 20) + (Wind Speed × 10) + Weather Penalty +
              Crew Penalty + Equipment Penalty
```

Thresholds:
- **0-40**: Low risk - Proceed
- **41-70**: Medium risk - Proceed with caution
- **>70**: High risk - Trip blocked, requires admin override

### Trip Blocking

System automatically blocks trip start if:
- Risk score > 70
- Any crew certification expired
- Required equipment missing
- Severe weather warning issued

Admin can override with documented justification.

## Destination Risk Profiles

Each destination assessed for:
- Historical incident rate
- Navigation difficulty
- Medical facility access
- Communication coverage
- Evacuation routes
- Seasonal hazards

Risk levels: Low / Medium / High

## Dynamic Risk Assessment

Guides trained to:
- Reassess conditions during trip
- Modify plan if risks increase
- Abort activity if unsafe
- Return to base if necessary

## Documentation

All risk assessments stored in system with:
- Assessment date/time
- Assessor name
- Conditions assessed
- Risk level determined
- Control measures
- GPS location

Retention: 7 years

