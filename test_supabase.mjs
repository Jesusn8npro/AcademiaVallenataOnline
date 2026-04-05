const API_URL = 'https://tbijzvtyyewhtwgakgka.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaWp6dnR5eWV3aHR3Z2FrZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NTQyNjIsImV4cCI6MjA1ODUzMDI2Mn0.P09L8OpLpcrm5XzTLAN0oQllhl_bePk5bxbUUpoG-cQ';

async function test() {
  const res = await fetch(API_URL);
  const json = await res.json();
  console.log("validaciones_tutorial columns:", Object.keys(json.definitions.validaciones_tutorial.properties));
}
test();
