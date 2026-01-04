# Performance Optimization Notes

## Database Index Optimization

### Recommended Indexes for Guide App Performance

#### 1. Guide Status Queries
```sql
-- Index for guide_status lookups
CREATE INDEX IF NOT EXISTS idx_guide_status_guide_id_branch 
ON guide_status(guide_id, branch_id) 
WHERE guide_id IS NOT NULL;

-- Index for guide_availability queries
CREATE INDEX IF NOT EXISTS idx_guide_availability_guide_id_until 
ON guide_availability(guide_id, available_until) 
WHERE available_until >= NOW();
```

#### 2. Trip Queries
```sql
-- Index for trip_crews lookups
CREATE INDEX IF NOT EXISTS idx_trip_crews_guide_status 
ON trip_crews(guide_id, status) 
WHERE status IN ('assigned', 'confirmed');

-- Index for trip_guides lookups
CREATE INDEX IF NOT EXISTS idx_trip_guides_guide_status 
ON trip_guides(guide_id, assignment_status) 
WHERE assignment_status IN ('confirmed', 'pending_confirmation');

-- Index for trips date queries
CREATE INDEX IF NOT EXISTS idx_trips_date_status 
ON trips(date, status) 
WHERE date IS NOT NULL;
```

#### 3. Stats Queries
```sql
-- Index for completed trips count
CREATE INDEX IF NOT EXISTS idx_trip_guides_completed 
ON trip_guides(guide_id, check_in_at, check_out_at) 
WHERE check_in_at IS NOT NULL AND check_out_at IS NOT NULL;

-- Index for reviews with guide_rating
CREATE INDEX IF NOT EXISTS idx_reviews_guide_rating 
ON reviews(booking_id, guide_rating) 
WHERE guide_rating IS NOT NULL;
```

#### 4. Notifications Queries
```sql
-- Index for urgent notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_urgent 
ON notifications(user_id, read, is_urgent, created_at) 
WHERE read = false AND (is_urgent = true OR type IN ('trip_assignment', 'deadline'));
```

### Query Optimization Recommendations

1. **Use specific field selection** - Always select only needed fields instead of `select('*')`
2. **Limit results** - Use `.limit()` for list queries
3. **Use database views** - Create views for complex joins that are frequently queried
4. **Monitor slow queries** - Set up query logging to identify bottlenecks

### Example Optimized Query

```typescript
// ❌ Before: Selects all fields
const { data } = await supabase
  .from('trips')
  .select('*')
  .eq('guide_id', userId);

// ✅ After: Selects only needed fields
const { data } = await supabase
  .from('trips')
  .select('id, code, name, date, status, destination')
  .eq('guide_id', userId)
  .limit(20);
```

## API Response Optimization

### Field Selection Best Practices

1. **Dashboard APIs** - Only return fields needed for dashboard display
2. **List APIs** - Return minimal fields, full details available via detail endpoint
3. **Nested selects** - Use Supabase nested selects for related data instead of multiple queries

### Caching Strategy

- **Short TTL (1-2 min)**: Frequently changing data (trips, notifications)
- **Medium TTL (5 min)**: Moderately changing data (stats, wallet)
- **Long TTL (10+ min)**: Rarely changing data (certifications, menu items)

## Next Steps

1. Run database migration to add recommended indexes
2. Monitor query performance after index addition
3. Adjust TTL values based on actual usage patterns
4. Set up query performance monitoring

