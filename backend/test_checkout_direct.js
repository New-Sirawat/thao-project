async function test() {
  const reqBody = {
    checkOut: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const res = await fetch('https://vescjjkwgkmjhbsgbvvt.supabase.co/rest/v1/attendances?userId=eq.f5cdfe50-528c-4bb2-8289-8f7895e49f6c&date=eq.2026-06-25', {
    method: 'PATCH',
    headers: {
      'apikey': 'sb_publishable_b8XTCsANXZ6VAzy4pICO6Q__XsIpI5Y',
      'Authorization': 'Bearer sb_publishable_b8XTCsANXZ6VAzy4pICO6Q__XsIpI5Y',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(reqBody)
  });
  
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Data:", data);
}

test();
