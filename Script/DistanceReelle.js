const xlsx = require("xlsx");
const { Worker } = require("worker_threads");
const os = require("os");

function loadExcel(file) {
    const wb = xlsx.readFile(file);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return { wb, sheetName: wb.SheetNames[0], data: xlsx.utils.sheet_to_json(sheet, { defval: "" }) };
}

function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

function runWorker(id, coords) {
    return new Promise((resolve) => {
        const worker = new Worker("./workers/matrixWorker.js", { workerData: { id, coords } });
        worker.on("message", resolve);
        worker.on("error", err => resolve({ id, error: err.message }));
    });
}

async function runWorkersInPool(chunks, maxParallel) {
    let index = 0;
    let results = [];

    async function launchNext() {
        if (index >= chunks.length) return;

        let currentIndex = index;
        index++;

        const res = await runWorker(currentIndex, chunks[currentIndex]);
        results[currentIndex] = res;

        await launchNext();
    }

    let pool = [];
    for (let i = 0; i < Math.min(maxParallel, chunks.length); i++) {
        pool.push(launchNext());
    }

    await Promise.all(pool);
    return results;
}

async function main() {
    const { wb, sheetName, data } = loadExcel("../eval2.xlsx");

    data.sort((a, b) =>
        Number(a.trip_id) - Number(b.trip_id) ||
        Number(a.stop_sequence) - Number(b.stop_sequence)
    );

    const coords = data.map(r => ({ lat: Number(r.arret_lat), lon: Number(r.arret_lon) }));

    const maxChunkSize = 100;
    const cpuCount = Math.max(os.cpus().length - 1, 1);
    const maxParallelWorkers = Math.min(cpuCount, 5); // Limite pour éviter 429

    const coordChunks = chunk(coords, maxChunkSize);
    console.log(` Total chunks = ${coordChunks.length}`);
    console.log(`⚙️ Threads CPU: ${cpuCount}, Max parallel OSRM calls: ${maxParallelWorkers}`);

    console.log("🚀 Lancement en pool contrôlé...");
    const results = await runWorkersInPool(coordChunks, maxParallelWorkers);

    let fullMatrices = [];
    for (const res of results) {
        if (res.error) {
            console.error(`❌ Erreur worker #${res.id}: ${res.error}`);
            return;
        }
        fullMatrices.push({ index: res.id, distances: res.distances });
    }

    for (let i = 0; i < data.length; i++) {
        const cur = data[i];
        const prev = data[i - 1];
        let dist = 0;

        if (prev && prev.trip_id === cur.trip_id) {
            let chunkId = Math.floor((i - 1) / maxChunkSize);
            let localPrev = (i - 1) % maxChunkSize;
            let localCur = i % maxChunkSize;
            dist = fullMatrices[chunkId].distances[localPrev][localCur];
        }

        cur.distance = Number(dist || 0).toFixed(2);
    }

    const newSheet = xlsx.utils.json_to_sheet(data);
    wb.Sheets[sheetName] = newSheet;
    xlsx.writeFile(wb, "resultat_matrix_multithread.xlsx");

    console.log("\n🎉 Terminé sans erreur 429 !");
}

main();
