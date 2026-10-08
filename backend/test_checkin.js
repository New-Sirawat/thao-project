async function testCheckIn() {
  const reqBody = {
    user_id: "f5cdfe50-528c-4bb2-8289-8f7895e49f6c",
    latitude: 16.09831,
    longitude: 108.22820
  };

  const res = await fetch('http://localhost:3000/api/attendance/checkin', {
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

testCheckIn();
