const axios = require('axios');

const TOMTOM_API_KEY = "ThNRs63o69lOuocEMG4vIHOjlfe5oL8P"; // ⚠️ À changer urgent

async function getTomTomDistance(lat1, lon1, lat2, lon2){
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${lat1},${lon1}:${lat2},${lon2}/json?key=${TOMTOM_API_KEY}&travelMode=car&routeType=shortest`;

    try {
        const res = await axios.get(url);
        const meters = res.data.routes[0].summary.lengthInMeters;
        const seconds = res.data.routes[0].summary.travelTimeInSeconds;
        return { distance_m: meters, time_s: seconds };
    } catch (err) {
        console.error("Erreur API TomTom :", err.response?.data || err.message);
        return null;
    }
}

(async () => {
    const result = await getTomTomDistance(45.6275, 4.9752,45.625,4.9678);
    console.log(result);
})();
