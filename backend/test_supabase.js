async function test() {
  const res = await fetch('https://vescjjkwgkmjhbsgbvvt.supabase.co/rest/v1/leave_requests?select=*', {
    headers: {
      'apikey': 'sb_publishable_b8XTCsANXZ6VAzy4pICO6Q__XsIpI5Y',
      'Authorization': 'Bearer sb_publishable_b8XTCsANXZ6VAzy4pICO6Q__XsIpI5Y'
    }
  });
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Data:", data);
}

test();
เทอ