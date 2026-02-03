-- Instructions to Enable Supabase Webhook
-- Run this in the Supabase SQL Editor

-- 1. Enable the pg_net extension if not already enabled (usually enabled by default on Supabase logic)
create extension if not exists pg_net;

-- 2. Create the Trigger Function
create or replace function public.trigger_daily_task_completion_webhook()
returns trigger as $$
begin
  -- Replace with your actual n8n Webhook URL
  perform net.http_post(
    url := 'https://webhook.oakia.com.br/webhook/daily-task-completed',
    body := json_build_object(
        'record', new,
        'old', old,
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA
    )::jsonb
  );
  return new;
end;
$$ language plpgsql security definer;

-- 3. Create the Trigger
drop trigger if exists on_daily_task_completion on public.daily_task_completions;

create trigger on_daily_task_completion
after insert or update on public.daily_task_completions
for each row execute function public.trigger_daily_task_completion_webhook();
