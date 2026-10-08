async function testCheckOut() {
  const reqBody = {
    user_id: "f5cdfe50-528c-4bb2-8289-8f7895e49f6c"
  };

  const res = await fetch('http://localhost:3000/api/attendance/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reqBody)
  });
  
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Data:", data);
}

testCheckOut();
