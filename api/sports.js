// Sports features API - Live scores, schedules, betting lines, and news
const axios = require('axios');

// Free sports API endpoint - using TheSportsDB API
const SPORTS_API_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

// Alternative API for more comprehensive data (ESPN public API)
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    console.log('🏈 Sports API Request:', req.method, req.url);
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = url.searchParams.get('action');
    const sport = url.searchParams.get('sport') || 'football';
    const league = url.searchParams.get('league') || 'nfl';
    
    // Live scores endpoint
    if (req.method === 'GET' && action === 'live_scores') {
      try {
        // Use ESPN API for live scores
        const apiUrl = `${ESPN_API_BASE}/${sport}/${league}/scoreboard`;
        console.log('📊 Fetching live scores from:', apiUrl);
        
        const response = await axios.get(apiUrl, { timeout: 5000 });
        
        if (response.data && response.data.events) {
          const games = response.data.events.map(event => {
            const competition = event.competitions[0];
            const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
            const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
            
            return {
              id: event.id,
              name: event.name,
              date: event.date,
              status: event.status.type.description,
              homeTeam: {
                name: homeTeam.team.displayName,
                abbreviation: homeTeam.team.abbreviation,
                score: homeTeam.score,
                logo: homeTeam.team.logo
              },
              awayTeam: {
                name: awayTeam.team.displayName,
                abbreviation: awayTeam.team.abbreviation,
                score: awayTeam.score,
                logo: awayTeam.team.logo
              },
              venue: competition.venue?.fullName || 'TBD',
              broadcast: competition.broadcasts?.[0]?.names?.[0] || 'N/A'
            };
          });
          
          res.status(200).json({
            success: true,
            data: {
              league: league.toUpperCase(),
              sport: sport,
              games: games,
              lastUpdated: new Date().toISOString()
            },
            source: 'ESPN API'
          });
        } else {
          throw new Error('No data received from API');
        }
      } catch (error) {
        console.error('❌ Error fetching live scores:', error.message);
        
        // Return fallback mock data
        res.status(200).json({
          success: true,
          data: {
            league: league.toUpperCase(),
            sport: sport,
            games: getMockGames(),
            lastUpdated: new Date().toISOString()
          },
          source: 'fallback',
          error: 'Live API temporarily unavailable'
        });
      }
      return;
    }
    
    // Game schedules endpoint
    if (req.method === 'GET' && action === 'schedules') {
      const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0].replace(/-/g, '');
      
      try {
        const apiUrl = `${ESPN_API_BASE}/${sport}/${league}/scoreboard?dates=${date}`;
        console.log('📅 Fetching schedules from:', apiUrl);
        
        const response = await axios.get(apiUrl, { timeout: 5000 });
        
        if (response.data && response.data.events) {
          const schedule = response.data.events.map(event => {
            const competition = event.competitions[0];
            const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
            const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
            
            return {
              id: event.id,
              name: event.name,
              shortName: event.shortName,
              date: event.date,
              time: new Date(event.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              status: event.status.type.description,
              homeTeam: homeTeam.team.displayName,
              awayTeam: awayTeam.team.displayName,
              venue: competition.venue?.fullName || 'TBD',
              broadcast: competition.broadcasts?.[0]?.names?.[0] || 'TBD'
            };
          });
          
          res.status(200).json({
            success: true,
            data: {
              league: league.toUpperCase(),
              sport: sport,
              date: date,
              schedule: schedule,
              lastUpdated: new Date().toISOString()
            },
            source: 'ESPN API'
          });
        } else {
          throw new Error('No schedule data received');
        }
      } catch (error) {
        console.error('❌ Error fetching schedules:', error.message);
        
        res.status(200).json({
          success: true,
          data: {
            league: league.toUpperCase(),
            sport: sport,
            date: date,
            schedule: getMockSchedule(),
            lastUpdated: new Date().toISOString()
          },
          source: 'fallback'
        });
      }
      return;
    }
    
    // Betting lines endpoint (mock data as free APIs don't provide this)
    if (req.method === 'GET' && action === 'betting_lines') {
      const gameId = url.searchParams.get('game_id');
      
      res.status(200).json({
        success: true,
        data: {
          notice: 'Betting lines require premium API access',
          games: getMockBettingLines(gameId),
          disclaimer: 'For entertainment purposes only. Please gamble responsibly.',
          lastUpdated: new Date().toISOString()
        },
        source: 'mock'
      });
      return;
    }
    
    // Sports news endpoint
    if (req.method === 'GET' && action === 'news') {
      try {
        const apiUrl = `${ESPN_API_BASE}/${sport}/${league}/news`;
        console.log('📰 Fetching news from:', apiUrl);
        
        const response = await axios.get(apiUrl, { timeout: 5000 });
        
        if (response.data && response.data.articles) {
          const news = response.data.articles.slice(0, 10).map(article => ({
            id: article.dataSourceIdentifier || Math.random().toString(36),
            headline: article.headline,
            description: article.description,
            published: article.published,
            images: article.images?.[0]?.url,
            link: article.links?.web?.href
          }));
          
          res.status(200).json({
            success: true,
            data: {
              league: league.toUpperCase(),
              sport: sport,
              articles: news,
              lastUpdated: new Date().toISOString()
            },
            source: 'ESPN API'
          });
        } else {
          throw new Error('No news data received');
        }
      } catch (error) {
        console.error('❌ Error fetching news:', error.message);
        
        res.status(200).json({
          success: true,
          data: {
            league: league.toUpperCase(),
            sport: sport,
            articles: getMockNews(),
            lastUpdated: new Date().toISOString()
          },
          source: 'fallback'
        });
      }
      return;
    }
    
    // Team standings endpoint
    if (req.method === 'GET' && action === 'standings') {
      try {
        const apiUrl = `${ESPN_API_BASE}/${sport}/${league}/standings`;
        console.log('🏆 Fetching standings from:', apiUrl);
        
        const response = await axios.get(apiUrl, { timeout: 5000 });
        
        if (response.data && response.data.children) {
          const standings = response.data.children.map(division => ({
            name: division.name,
            teams: division.standings.entries.map(entry => ({
              team: entry.team.displayName,
              stats: entry.stats.reduce((acc, stat) => {
                acc[stat.name] = stat.displayValue;
                return acc;
              }, {})
            }))
          }));
          
          res.status(200).json({
            success: true,
            data: {
              league: league.toUpperCase(),
              sport: sport,
              standings: standings,
              lastUpdated: new Date().toISOString()
            },
            source: 'ESPN API'
          });
        } else {
          throw new Error('No standings data received');
        }
      } catch (error) {
        console.error('❌ Error fetching standings:', error.message);
        
        res.status(200).json({
          success: true,
          data: {
            league: league.toUpperCase(),
            sport: sport,
            standings: [],
            lastUpdated: new Date().toISOString()
          },
          source: 'fallback',
          error: 'Standings temporarily unavailable'
        });
      }
      return;
    }
    
    // Default - API information
    res.status(200).json({
      success: true,
      message: 'Sports Data API',
      endpoints: [
        {
          path: '?action=live_scores',
          description: 'Get live game scores',
          params: 'sport (football, basketball, baseball), league (nfl, nba, mlb, college-football)'
        },
        {
          path: '?action=schedules',
          description: 'Get game schedules',
          params: 'sport, league, date (YYYYMMDD format)'
        },
        {
          path: '?action=betting_lines',
          description: 'Get betting lines for games',
          params: 'game_id (optional)'
        },
        {
          path: '?action=news',
          description: 'Get latest sports news',
          params: 'sport, league'
        },
        {
          path: '?action=standings',
          description: 'Get team standings',
          params: 'sport, league'
        }
      ],
      supportedSports: ['football', 'basketball', 'baseball', 'hockey'],
      supportedLeagues: ['nfl', 'nba', 'mlb', 'nhl', 'college-football'],
      version: '1.0.0'
    });
    
  } catch (error) {
    console.error('❌ Sports API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// Mock data functions for fallback
function getMockGames() {
  return [
    {
      id: '1',
      name: 'Kansas City Chiefs vs Buffalo Bills',
      status: 'Live - 2nd Quarter',
      homeTeam: {
        name: 'Kansas City Chiefs',
        abbreviation: 'KC',
        score: '14',
        logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png'
      },
      awayTeam: {
        name: 'Buffalo Bills',
        abbreviation: 'BUF',
        score: '10',
        logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png'
      },
      venue: 'Arrowhead Stadium',
      broadcast: 'CBS'
    },
    {
      id: '2',
      name: 'Dallas Cowboys vs Philadelphia Eagles',
      status: 'Scheduled',
      homeTeam: {
        name: 'Dallas Cowboys',
        abbreviation: 'DAL',
        score: '0',
        logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png'
      },
      awayTeam: {
        name: 'Philadelphia Eagles',
        abbreviation: 'PHI',
        score: '0',
        logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png'
      },
      venue: 'AT&T Stadium',
      broadcast: 'FOX'
    }
  ];
}

function getMockSchedule() {
  const today = new Date();
  return [
    {
      id: '1',
      name: 'Team A vs Team B',
      shortName: 'A vs B',
      date: today.toISOString(),
      time: '1:00 PM',
      status: 'Scheduled',
      homeTeam: 'Team A',
      awayTeam: 'Team B',
      venue: 'Stadium A',
      broadcast: 'ESPN'
    }
  ];
}

function getMockBettingLines(gameId) {
  return [
    {
      gameId: gameId || '1',
      matchup: 'Team A vs Team B',
      spread: {
        home: '-3.5',
        away: '+3.5',
        odds: '-110'
      },
      moneyline: {
        home: '-165',
        away: '+145'
      },
      total: {
        over: '47.5 (-110)',
        under: '47.5 (-110)'
      }
    }
  ];
}

function getMockNews() {
  return [
    {
      id: '1',
      headline: 'Big Game Preview: Championship Matchup',
      description: 'Analysis of the upcoming championship game',
      published: new Date().toISOString(),
      images: null,
      link: '#'
    },
    {
      id: '2',
      headline: 'Star Player Returns from Injury',
      description: 'Key player expected to make season debut',
      published: new Date().toISOString(),
      images: null,
      link: '#'
    }
  ];
}
