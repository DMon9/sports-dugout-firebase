export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Mock NCAA games for Saturday (replace with real API later)
  const games = [
    {
      id: 1,
      homeTeam: "Alabama",
      awayTeam: "Georgia", 
      homeScore: 0,
      awayScore: 0,
      gameTime: "3:30 PM EST",
      status: "upcoming",
      spread: "ALA -3.5",
      over_under: "52.5"
    },
    {
      id: 2,
      homeTeam: "Ohio State",
      awayTeam: "Michigan",
      homeScore: 14,
      awayScore: 7,
      gameTime: "Live - 2nd Q",
      status: "live",
      spread: "OSU -7",
      over_under: "45.5"
    }
  ];
  
  res.json({ games, updated: new Date().toISOString() });
}
