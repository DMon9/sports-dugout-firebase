export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const predictions = {
    featured_game: {
      matchup: "Alabama vs Georgia",
      ai_confidence: 87,
      predicted_winner: "Alabama",
      predicted_score: "Alabama 28, Georgia 21",
      key_factors: [
        "Alabama's rushing offense vs Georgia's run defense",
        "Weather conditions favor ground game",
        "Georgia missing key defensive player"
      ],
      betting_recommendations: [
        {
          bet: "Alabama -3.5",
          confidence: 85,
          reasoning: "Strong rushing attack should control game"
        },
        {
          bet: "Under 52.5",
          confidence: 78,
          reasoning: "Both defenses likely to perform well"
        }
      ]
    },
    model_stats: {
      season_accuracy: "74.2%",
      last_week: "8-3",
      trend: "📈 Hot streak"
    }
  };
  
  res.json(predictions);
}
