export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'GET') {
    // Return current squares pool
    const squares = {
      gameId: 1,
      gameTitle: "Alabama vs Georgia",
      pricePerSquare: 10,
      totalPot: 1000,
      squaresSold: 85,
      totalSquares: 100,
      payouts: {
        "1st Quarter": "$250",
        "2nd Quarter": "$250", 
        "3rd Quarter": "$250",
        "Final": "$250"
      },
      grid: generateSquaresGrid()
    };
    
    res.json(squares);
  }
  
  if (req.method === 'POST') {
    const { squareNumber, playerEmail } = req.body;
    
    // Purchase square logic here
    res.json({ 
      success: true, 
      square: squareNumber,
      message: "Square purchased successfully!" 
    });
  }
}

function generateSquaresGrid() {
  const grid = [];
  for (let i = 0; i < 100; i++) {
    grid.push({
      number: i,
      owner: Math.random() > 0.7 ? `User${Math.floor(Math.random() * 1000)}` : null,
      homeNumber: i % 10,
      awayNumber: Math.floor(i / 10)
    });
  }
  return grid;
}
