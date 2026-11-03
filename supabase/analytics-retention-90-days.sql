-- Bhaai PDFs Library: retain detailed download/share activity for 90 days.
-- Cumulative download_counts and whatsapp_share_counts are intentionally untouched.
-- Run once in the Supabase SQL Editor.

create extension if not exists pg_cron with schema pg_catalog;

-- Remove any previous job with this name so this migration is safe to rerun.
select cron.unschedule(jobid)
from cron.job
where jobname = 'bhaai-analytics-retention-90-days';

-- Schedule daily cleanup at 03:17 UTC.
select cron.schedule(
  'bhaai-analytics-retention-90-days',
  '17 3 * * *',
  $job$
    delete from public.analytics_events
    where created_at < now() - interval '90 days';
  $job$
);

-- Apply the retention rule immediately as well; the scheduled job maintains it daily.
delete from public.analytics_events
where created_at < now() - interval '90 days';
