// workers/matrixWorker.js
const axios = require("axios");
const { parentPort, workerData } = require("worker_threads");

const OSRM = "https://router.project-osrm.org";

function buildURL(coords) {
    const coordStr = coords.map(c => `${c.lon},${c.lat}`).join(";");
    return `${OSRM}/table/v1/driving/${coordStr}?annotations=distance`;
}

(async () => {
    try {
        const url = buildURL(workerData.coords);
        const res = await axios.get(url, { timeout: 20000 });

        if (!res.data?.distances) {
            throw new Error("Pas de matrice reçue !");
        }

        parentPort.postMessage({
            id: workerData.id,
            distances: res.data.distances
        });

    } catch (err) {
        parentPort.postMessage({
            id: workerData.id,
            error: err.message
        });
    }
})();
