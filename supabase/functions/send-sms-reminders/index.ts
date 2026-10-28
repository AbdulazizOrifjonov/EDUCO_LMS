// ==============================================================================
// EDUCO LMS - Supabase Edge Function: Automated SMS Reminders & Queue Processor
// Deploy with: supabase functions deploy send-sms-reminders
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check if SMS system is enabled
    const { data: settings } = await supabase
      .from('sms_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!settings || !settings.is_enabled) {
      return new Response(JSON.stringify({ status: 'disabled', message: 'SMS tizimi o‘chirilgan' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch pending items
    const { data: queueItems } = await supabase
      .from('sms_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(15);

    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ status: 'empty', message: 'Navbatda xabarlar yo‘q' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Fetch active primary and backup devices
    const { data: devices } = await supabase.from('sms_devices').select('*').eq('is_active', true);
    const primaryDevice = devices?.find((d) => d.device_role === 'primary');
    const backupDevice = devices?.find((d) => d.device_role === 'backup');

    if (!primaryDevice && !backupDevice) {
      return new Response(JSON.stringify({ status: 'no_devices', message: 'Birorta ham faol Gateway qurilmasi yo‘q' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    let failed = 0;

    for (const item of queueItems) {
      let delivered = false;
      let activeDevice = primaryDevice;
      let lastError = null;

      // Try Primary
      if (activeDevice) {
        try {
          const res = await fetch(activeDevice.gateway_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(activeDevice.api_token ? { 'Authorization': `Bearer ${activeDevice.api_token}` } : {}),
            },
            body: JSON.stringify({ to: item.recipient_phone, message: item.message_text, sim: 1 }),
          });
          if (res.ok) delivered = true;
          else lastError = `Primary HTTP ${res.status}`;
        } catch (e) {
          lastError = `Primary error: ${e.message}`;
        }
      }

      // Failover to Backup
      if (!delivered && backupDevice) {
        activeDevice = backupDevice;
        try {
          const res = await fetch(backupDevice.gateway_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(backupDevice.api_token ? { 'Authorization': `Bearer ${backupDevice.api_token}` } : {}),
            },
            body: JSON.stringify({ to: item.recipient_phone, message: item.message_text, sim: 1 }),
          });
          if (res.ok) {
            delivered = true;
            lastError = null;
          } else {
            lastError = `${lastError || ''} | Backup HTTP ${res.status}`;
          }
        } catch (e) {
          lastError = `${lastError || ''} | Backup error: ${e.message}`;
        }
      }

      // Update item
      if (delivered) {
        sent++;
        await supabase.from('sms_queue').update({
          status: 'sent',
          device_id: activeDevice?.id,
          sent_at: new Date().toISOString(),
          error_message: null,
        }).eq('id', item.id);

        await supabase.from('sms_logs').insert([{
          queue_id: item.id,
          device_id: activeDevice?.id,
          recipient_phone: item.recipient_phone,
          status: 'sent',
          response_payload: { delivered_via: activeDevice?.name },
        }]);
      } else {
        failed++;
        const attempts = (item.attempts || 0) + 1;
        const willRetry = attempts < (item.max_attempts || 3);
        await supabase.from('sms_queue').update({
          status: willRetry ? 'pending' : 'failed',
          attempts,
          error_message: lastError,
          last_attempt_at: new Date().toISOString(),
        }).eq('id', item.id);

        await supabase.from('sms_logs').insert([{
          queue_id: item.id,
          recipient_phone: item.recipient_phone,
          status: 'failed',
          error_details: lastError,
        }]);
      }

      // 4-second delay
      await new Promise((res) => setTimeout(res, 4000));
    }

    return new Response(JSON.stringify({ status: 'success', sent, failed, total: queueItems.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
