const xlsx = require('xlsx');
const axios = require('axios');

const OSRM_BASE = 'https://router.project-osrm.org';

function loadFileExcel(file) {
  const execFile = xlsx.readFile(file);
  const SheetName = execFile.SheetNames[0];
  const sheet = execFile.Sheets[SheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  return { execFile, SheetName, data };
}

function osrmRouteUrl(lonA, latA, lonB, latB, profile = 'driving') {
  return `${OSRM_BASE}/route/v1/${profile}/${lonA},${latA};${lonB},${latB}?overview=false`;
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function getDistanceOSRM(lonA, latA, lonB, latB) {

  if (![latA, lonA, latB, lonB].every(v =>
    v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v)))) {
    return 0;
  }

  const url = osrmRouteUrl(lonA, latA, lonB, latB);

  try {
    const res = await axios.get(url, { timeout: 10000 });
    if (res.data?.routes?.length > 0) {
      return res.data.routes[0].distance;  // en mètres
    } else {
      console.warn("Pas de route trouvée.");
      return 0;
    }
  } catch (err) {
    console.error("Erreur OSRM:", err.message || err);
    return 0;
  }
}
function extractUniqueSegments(data) {
  const trips = {};
  const segmentMap = new Map();

  // Regrouper par trip
  data.forEach(r => {
    if (!trips[r.trip_id]) trips[r.trip_id] = [];
    trips[r.trip_id].push(r);
  });

  // Trier et générer segments
  Object.keys(trips).forEach(tripId => {
    const rows = trips[tripId].sort((a, b) => a.stop_sequence - b.stop_sequence);

    for (let i = 0; i < rows.length - 1; i++) {
      const r1 = rows[i];
      const r2 = rows[i + 1];

      const key = `${r1.stop_id}-${r2.stop_id}`;
      if (!segmentMap.has(key)) {
        segmentMap.set(key, {
          from_stop: r1.stop_id,
          to_stop: r2.stop_id,
          lonA: r1.arret_lon,
          latA: r1.arret_lat,
          lonB: r2.arret_lon,
          latB: r2.arret_lat
        });
      }
    }
  });
  console.log(`Segments uniques trouvés : ${segmentMap.size}`);

  return Array.from(segmentMap.values());
}
async function main() {

  console.time("Durée totale");

  const { execFile, SheetName, data } = loadFileExcel('../eval2.xlsx');
  const segments = extractUniqueSegments(data);
  const distanceMap = new Map();

  // Calculer distance de chaque segment unique
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    console.log(`Segment ${i + 1}/${segments.length} → ${s.from_stop} → ${s.to_stop}`);

    const dist = await getDistanceOSRM(s.lonA, s.latA, s.lonB, s.latB);
    distanceMap.set(`${s.from_stop}-${s.to_stop}`, dist);

    await sleep(50);
  }

  data.sort((a, b) => {
    const t = (Number(a.trip_id) || 0) - (Number(b.trip_id) || 0);
    if (t !== 0) return t;
    return (Number(a.stop_sequence) || 0) - (Number(b.stop_sequence) || 0);
  });

  let lastTrip = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    if (row.trip_id !== lastTrip) {  // Première ligne du trip
      row.distance = 0;
      lastTrip = row.trip_id;
    } else {  // Ligne suivante same trip
      const prev = data[i - 1];
      const key = `${prev.stop_id}-${row.stop_id}`;
      row.distance = Number(distanceMap.get(key) || 0).toFixed(2);
    }
  }
  const newSheet = xlsx.utils.json_to_sheet(data);
  execFile.Sheets[SheetName] = newSheet;
  xlsx.writeFile(execFile, 'resultat_distanceoutput.xlsx');

  console.timeEnd("Durée totale");
}
main().catch(err => console.error(err)); 


