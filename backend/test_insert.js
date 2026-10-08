async function test() {
  const record = {
    id: "test-uuid-1234",
    userId: "2222",
    date: "2026-06-25",
    checkIn: new Date().toISOString(),
    status: "PRESENT"
  };

  const res = await fetch('https://vescjjkwgkmjhbsgbvvt.supabase.co/rest/v1/attendances', {
    method: 'POST',
    headers: {
      'apikey': 'sb_publishable_b8XTCsANXZ6VAzy4pICO6Q__XsIpI5Y',
      'Authorization': 'Bearer sb_publishable_b8XTCsANXZ6VAzy4pICO6Q__XsIpI5Y',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(record)
  });
  
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Data:", data);
}

test();
