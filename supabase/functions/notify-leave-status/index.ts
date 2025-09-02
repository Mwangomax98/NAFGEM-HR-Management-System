import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { record, old_record } = await req.json()

    // Only proceed if status has changed
    if (!old_record || record.status === old_record.status) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let notificationType: 'info' | 'success' | 'error' | 'warning' = 'info'
    let title = ''
    let message = ''

    switch (record.status) {
      case 'approved':
        notificationType = 'success'
        title = 'Leave Request Approved'
        message = `Your leave request (${record.ref_number}) has been approved.`
        break
      case 'rejected':
        notificationType = 'error'
        title = 'Leave Request Rejected'
        message = `Your leave request (${record.ref_number}) has been rejected.`
        break
      case 'pending':
        notificationType = 'info'
        title = 'Leave Request Submitted'
        message = `Your leave request (${record.ref_number}) has been submitted for review.`
        break
      default:
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    await supabase
      .from('notifications')
      .insert({
        user_id: record.requester_id,
        type: notificationType,
        title,
        message,
        read: false
      })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})