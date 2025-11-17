
const xlsx = require('xlsx');

// function load Excel file
function loadFileExcel(file){
    const execFile = xlsx.readFile(file);
    const SheetName =execFile.SheetNames[0];
    const sheet = execFile.Sheets[SheetName];

    const data  = xlsx.utils.sheet_to_json(sheet);

    return {execFile ,  SheetName,data};

}

// function calculate distence formule de haversine

function calDistance(latA,lonA,latB,lonB){

if (!latA || !latB ||!lonA ||!lonB){
    return 0;
}

const convertRad =(deg)=>{

const rad=(deg* Math.PI)/180;
return rad;
}
 const calDeltatLon= (convertRad(lonB)-convertRad(lonA)) ;
 const calDeltaLat=  (convertRad(latB)-convertRad(latA));

const resultatPartiel= Math.sin(calDeltaLat/2)**2 +Math.cos(convertRad(latA))*Math.cos(convertRad(latB))*Math.sin(calDeltatLon/2)**2;


const result= 2*Math.atan2(Math.sqrt(resultatPartiel),Math.sqrt(1-resultatPartiel));

const R =6371*1000; // rayon de la terre en m

 DistenceResult =R*result;

 return DistenceResult;


}

// function main 

function main(){

    const{execFile,SheetName,data} =loadFileExcel("../eval2.xlsx");

    //trie pour garantir l ordre
    data.sort((a, b) => {
        const triA = Number(a.trip_id) - Number(b.trip_id);
          if (triA !== 0) return triA; 
      return Number(a.stop_sequence) - Number(b.stop_sequence); 
      });


    for(let i=0;i<data.length;i++){
        const current = data[i];
        const previous = data[i - 1]; 
        let distance = 0;


        if (previous && previous.trip_id === current.trip_id) {
            const latPrev =Number(previous.arret_lat);
            const lonPrev = Number(previous.arret_lon);
            const latCur  = Number(current.arret_lat);
            const lonCur  = Number(current.arret_lon);

            distance = calDistance(latPrev, lonPrev, latCur, lonCur);
        } else {
            distance = 0;
        }

        current.distance = Number(distance).toFixed(2);
    
    }
    const newSheet = xlsx.utils.json_to_sheet(data);
    execFile.Sheets[SheetName] = newSheet;
    xlsx.writeFile(execFile,"resultat_distance.xlsx");

}

main();


