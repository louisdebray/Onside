import axios from 'axios';
import { setCached } from '../cache/store.js';

function serviceUrl() {
  return process.env.TRANSFERMARKT_SERVICE_URL || 'http://localhost:8000';
}

export async function getClubPlayers(clubId) {
  const res = await axios.get(`${serviceUrl()}/clubs/${clubId}/players`);
  return res.data;
}

export async function getPlayerTransfers(playerId) {
  const res = await axios.get(`${serviceUrl()}/players/${playerId}/transfers`);
  return res.data;
}

export async function searchClubs(query) {
  const res = await axios.get(`${serviceUrl()}/clubs/search/${encodeURIComponent(query)}`);
  return res.data?.results || [];
}

const CLUB_SUFFIX_RE = /\s+(FC|CF|AFC|AC|SC|RC|CD|SAD|BC|\d{3,4})$/i;

// football-data.org et Transfermarkt ne nomment pas les clubs pareil (ex: "Paris
// Saint-Germain FC" vs "Paris Saint-Germain", "Stade Rennais FC 1901" vs "Stade
// Rennais FC") : une recherche avec le nom complet ne trouve souvent rien. On
// retire donc progressivement les suffixes génériques jusqu'à obtenir un résultat.
export async function findTransfermarktClub(name) {
  let candidate = name.trim();
  for (let i = 0; i < 3; i += 1) {
    const results = await searchClubs(candidate);
    if (results.length > 0) return results[0];
    const stripped = candidate.replace(CLUB_SUFFIX_RE, '').trim();
    if (stripped === candidate) break;
    candidate = stripped;
  }
  return null;
}

export async function searchPlayers(query) {
  const res = await axios.get(`${serviceUrl()}/players/search/${encodeURIComponent(query)}`);
  return res.data?.results || [];
}

export async function getPlayerProfile(playerId) {
  const res = await axios.get(`${serviceUrl()}/players/${playerId}/profile`);
  return res.data;
}

export async function getPlayerMarketValue(playerId) {
  const res = await axios.get(`${serviceUrl()}/players/${playerId}/market_value`);
  return res.data;
}

// `clubs` = [{ footballDataId, transfermarktId }]. Les deux identifiants sont
// distincts (systèmes différents) : transfermarktId sert à interroger l'API
// Transfermarkt, tandis que footballDataId est celui que le frontend connaît
// (stocké dans le localStorage du navigateur) et sert donc de clé de filtrage
// dans les données renvoyées.
export async function refreshFavoriteClubsTransfers(clubs) {
  const recentTransfers = [];
  const marketValues = [];

  for (const { footballDataId, transfermarktId } of clubs) {
    try {
      const { players = [] } = await getClubPlayers(transfermarktId);
      for (const player of players) {
        marketValues.push({
          id: player.id,
          name: player.name,
          position: player.position,
          age: player.age,
          nationality: player.nationality?.[0] || null,
          marketValue: player.marketValue ?? null,
          clubId: footballDataId,
        });

        try {
          const { transfers = [] } = await getPlayerTransfers(player.id);
          const arrival = transfers.find((t) => t.clubTo?.id === String(transfermarktId));
          if (arrival) {
            recentTransfers.push({
              player: player.name,
              playerId: player.id,
              clubId: footballDataId,
              from: arrival.clubFrom?.name || null,
              to: arrival.clubTo?.name || null,
              date: arrival.date,
              season: arrival.season || null,
              fee: arrival.fee ?? null,
            });
          }
        } catch (err) {
          console.error(`transfermarkt: échec récupération transferts joueur ${player.id}`, err.message);
        }
      }
    } catch (err) {
      console.error(`transfermarkt: échec récupération effectif club ${transfermarktId}`, err.message);
    }
  }

  recentTransfers.sort((a, b) => new Date(b.date) - new Date(a.date));
  const withFee = recentTransfers.filter((t) => t.fee != null);
  const result = {
    recentTransfers,
    mostExpensiveFavorites: [...withFee].sort((a, b) => b.fee - a.fee).slice(0, 20),
    marketValues,
  };

  setCached('transfermarkt:transfers', result, 26 * 60 * 60);
  return result;
}
