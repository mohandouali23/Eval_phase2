// // fichier: calc_route_distances_osrm.js
// const xlsx = require('xlsx');
// const axios = require('axios');

// const OSRM_BASE = 'https://router.project-osrm.org'; 

// function loadFileExcel(file){
//   const execFile = xlsx.readFile(file);
//   const SheetName = execFile.SheetNames[0];
//   const sheet = execFile.Sheets[SheetName];
//   const data = xlsx.utils.sheet_to_json(sheet, {defval: ''});
//   return { execFile, SheetName, data };
// }

// function osrmRouteUrl(lonA, latA, lonB, latB, profile='driving') {

//   return `${OSRM_BASE}/route/v1/${profile}/${lonA},${latA};${lonB},${latB}?overview=false`;
// }

// // small delay helper to avoid hammering a public API
// function sleep(ms){ return new Promise(res => setTimeout(res, ms)); }

// async function getDistanceOSRM(lonA, latA, lonB, latB) {

//   console.log("Coordonnées envoyées → ",
//     `A: (${latA}, ${lonA})  →  B: (${latB}, ${lonB})`
//   );
  
//     if (![latA,lonA,latB,lonB].every(v => v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v)))) {
//       return 0;
//     }
  
//     const url = osrmRouteUrl(lonA, latA, lonB, latB);

    
//   try {
//     const res = await axios.get(url, { timeout: 10000 });
//     if (res.data && res.data.routes && res.data.routes.length) {
//       return res.data.routes[0].distance; // en mètres
//     } else {
//       console.warn('pas de route trouvée .');
//       return 0;
//     }
//   } catch (err) {
//     console.error('Erreur OSRM', err.message || err.toString());
//     return 0;
//   }
// }

// async function main() {
//   const { execFile, SheetName, data } = loadFileExcel('../Book1.xlsx');


//   data.sort((a,b) => {
//     const t = (Number(a.trip_id) || 0) - (Number(b.trip_id) || 0);
//     if (t !== 0) return t;
//     return (Number(a.stop_sequence) || 0) - (Number(b.stop_sequence) || 0);
//   });

 
//   for (let i = 0; i < data.length; i++) {
//     const current = data[i];
//     const previous = data[i-1];

//     let distanceMeters = 0;

//     if (previous && String(previous.trip_id) === String(current.trip_id)) {
//       const latPrev = previous.arret_lat;
//       const lonPrev = previous.arret_lon;
//       const latCur  = current.arret_lat;
//       const lonCur  = current.arret_lon;

   
// distanceMeters = await getDistanceOSRM(lonPrev,latPrev,lonCur,latCur);
//       await sleep(150); 
//     } else {
//       distanceMeters = 0;
//     }

//     current.distance = Number(distanceMeters).toFixed(2);
//    }

//   const newSheet = xlsx.utils.json_to_sheet(data);
//   execFile.Sheets[SheetName] = newSheet;
//   xlsx.writeFile(execFile, 'resultat_distance.xlsx');
//   console.log('Terminé.');
// }

// main().catch(err => console.error(err));

