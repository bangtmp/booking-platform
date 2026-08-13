-- Prevent double-booking race: at most one PENDING/CONFIRMED booking per
-- (staff, date, startTime). CANCELLED/COMPLETED bookings do not occupy the slot
-- (matches availability engine blockingStatuses) so they are excluded.
CREATE UNIQUE INDEX "Booking_staff_date_start_time_unique"
  ON "Booking" ("staffId", "date", "startTime")
  WHERE "status" IN ('PENDING', 'CONFIRMED');
