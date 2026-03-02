import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const body = await req.json();

    // Support both generic (recipient_id, title, body) and legacy (assignee_id, task_title, assigner_name) params
    const recipientId = body.recipient_id ?? body.assignee_id;
    const title = body.title ?? (body.assigner_name ? `New task from ${body.assigner_name}` : null);
    const message = body.body ?? body.task_title;

    if (!recipientId || !title || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
      });
    }

    // Use service role to read push token (bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: user, error } = await supabase
      .from("users")
      .select("expo_push_token")
      .eq("id", recipientId)
      .single();

    if (error || !user?.expo_push_token) {
      return new Response(JSON.stringify({ skipped: "No push token" }), {
        status: 200,
      });
    }

    // Send via Expo Push API
    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: user.expo_push_token,
        title,
        body: message,
        sound: "default",
        ...(body.data ? { data: body.data } : {}),
      }),
    });

    const pushResult = await pushResponse.json();
    return new Response(JSON.stringify({ sent: true, result: pushResult }), {
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
