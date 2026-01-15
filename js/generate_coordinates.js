import Papa from 'papaparse';
import fs from 'fs';

/**
 * Top European cities with coordinates and approximate population weights
 * (weights sum roughly to 1)
 * Urban cities get higher weights
 */
const europeanCities = [
  { city: 'London', country: 'UK', lat: 51.5074, lon: -0.1278, weight: 0.06 },
  { city: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522, weight: 0.06 },
  { city: 'Berlin', country: 'Germany', lat: 52.5200, lon: 13.4050, weight: 0.05 },
  { city: 'Madrid', country: 'Spain', lat: 40.4168, lon: -3.7038, weight: 0.05 },
  { city: 'Rome', country: 'Italy', lat: 41.9028, lon: 12.4964, weight: 0.05 },
  { city: 'Barcelona', country: 'Spain', lat: 41.3851, lon: 2.1734, weight: 0.04 },
  { city: 'Vienna', country: 'Austria', lat: 48.2082, lon: 16.3738, weight: 0.04 },
  { city: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lon: 4.9041, weight: 0.04 },
  { city: 'Milan', country: 'Italy', lat: 45.4642, lon: 9.1900, weight: 0.04 },
  { city: 'Munich', country: 'Germany', lat: 48.1351, lon: 11.5820, weight: 0.03 },
  { city: 'Hamburg', country: 'Germany', lat: 53.5511, lon: 9.9937, weight: 0.03 },
  { city: 'Prague', country: 'Czech Republic', lat: 50.0755, lon: 14.4378, weight: 0.03 },
  { city: 'Brussels', country: 'Belgium', lat: 50.8503, lon: 4.3517, weight: 0.03 },
  { city: 'Budapest', country: 'Hungary', lat: 47.4979, lon: 19.0402, weight: 0.03 },
  { city: 'Warsaw', country: 'Poland', lat: 52.2297, lon: 21.0122, weight: 0.03 },
  { city: 'Lisbon', country: 'Portugal', lat: 38.7223, lon: -9.1393, weight: 0.03 },
  { city: 'Stockholm', country: 'Sweden', lat: 59.3293, lon: 18.0686, weight: 0.03 },
  { city: 'Copenhagen', country: 'Denmark', lat: 55.6761, lon: 12.5683, weight: 0.03 },
  { city: 'Naples', country: 'Italy', lat: 40.8518, lon: 14.2681, weight: 0.02 },
  { city: 'Dublin', country: 'Ireland', lat: 53.3498, lon: -6.2603, weight: 0.02 },
  { city: 'Athens', country: 'Greece', lat: 37.9838, lon: 23.7275, weight: 0.02 },
  { city: 'Zurich', country: 'Switzerland', lat: 47.3769, lon: 8.5417, weight: 0.02 },
  { city: 'Valencia', country: 'Spain', lat: 39.4699, lon: -0.3763, weight: 0.02 },
  { city: 'Seville', country: 'Spain', lat: 37.3891, lon: -5.9845, weight: 0.02 },
  { city: 'Cologne', country: 'Germany', lat: 50.9375, lon: 6.9603, weight: 0.02 },
  { city: 'Turin', country: 'Italy', lat: 45.0703, lon: 7.6869, weight: 0.02 },
  { city: 'Frankfurt', country: 'Germany', lat: 50.1109, lon: 8.6821, weight: 0.02 },
  { city: 'Oslo', country: 'Norway', lat: 59.9139, lon: 10.7522, weight: 0.02 },
  { city: 'Helsinki', country: 'Finland', lat: 60.1699, lon: 24.9384, weight: 0.02 },
  { city: 'Krakow', country: 'Poland', lat: 50.0647, lon: 19.9450, weight: 0.02 },
  { city: 'Lyon', country: 'France', lat: 45.7640, lon: 4.8357, weight: 0.02 },
  { city: 'Marseille', country: 'France', lat: 43.2965, lon: 5.3698, weight: 0.02 },
  { city: 'Geneva', country: 'Switzerland', lat: 46.2044, lon: 6.1432, weight: 0.02 },
  { city: 'Rotterdam', country: 'Netherlands', lat: 51.9225, lon: 4.4792, weight: 0.02 },
  { city: 'Stuttgart', country: 'Germany', lat: 48.7758, lon: 9.1829, weight: 0.02 },
  { city: 'Dortmund', country: 'Germany', lat: 51.5136, lon: 7.4653, weight: 0.01 },
  { city: 'Essen', country: 'Germany', lat: 51.4556, lon: 7.0116, weight: 0.01 },
  { city: 'Düsseldorf', country: 'Germany', lat: 51.2277, lon: 6.7735, weight: 0.01 },
  { city: 'Dresden', country: 'Germany', lat: 51.0504, lon: 13.7373, weight: 0.01 },
  { city: 'Leipzig', country: 'Germany', lat: 51.3397, lon: 12.3731, weight: 0.01 },
  { city: 'Hanover', country: 'Germany', lat: 52.3759, lon: 9.7320, weight: 0.01 },
  { city: 'Nuremberg', country: 'Germany', lat: 49.4521, lon: 11.0767, weight: 0.01 },
  { city: 'The Hague', country: 'Netherlands', lat: 52.0705, lon: 4.3007, weight: 0.01 },
  { city: 'Antwerp', country: 'Belgium', lat: 51.2194, lon: 4.4025, weight: 0.01 },
  { city: 'Palermo', country: 'Italy', lat: 38.1157, lon: 13.3615, weight: 0.01 },
  { city: 'Zaragoza', country: 'Spain', lat: 41.6488, lon: -0.8891, weight: 0.01 },
  { city: 'Málaga', country: 'Spain', lat: 36.7213, lon: -4.4214, weight: 0.01 },
  { city: 'Bilbao', country: 'Spain', lat: 43.2630, lon: -2.9350, weight: 0.01 },
  { city: 'Porto', country: 'Portugal', lat: 41.1579, lon: -8.6291, weight: 0.01 },
  { city: 'Toulouse', country: 'France', lat: 43.6047, lon: 1.4442, weight: 0.01 },
  { city: 'Nice', country: 'France', lat: 43.7102, lon: 7.2620, weight: 0.01 },
  { city: 'Nantes', country: 'France', lat: 47.2184, lon: -1.5536, weight: 0.01 },
  { city: 'Strasbourg', country: 'France', lat: 48.5734, lon: 7.7521, weight: 0.01 },
  { city: 'Bordeaux', country: 'France', lat: 44.8378, lon: -0.5792, weight: 0.01 },
  { city: 'Lille', country: 'France', lat: 50.6292, lon: 3.0573, weight: 0.01 },
  { city: 'Florence', country: 'Italy', lat: 43.7696, lon: 11.2558, weight: 0.01 },
  { city: 'Genoa', country: 'Italy', lat: 44.4056, lon: 8.9463, weight: 0.01 },
  { city: 'Bologna', country: 'Italy', lat: 44.4949, lon: 11.3426, weight: 0.01 },
  { city: 'Wrocław', country: 'Poland', lat: 51.1079, lon: 17.0385, weight: 0.01 },
  { city: 'Poznań', country: 'Poland', lat: 52.4064, lon: 16.9252, weight: 0.01 },
  { city: 'Gdańsk', country: 'Poland', lat: 54.3520, lon: 18.6466, weight: 0.01 },
  { city: 'Gothenburg', country: 'Sweden', lat: 57.7089, lon: 11.9746, weight: 0.01 },
  { city: 'Malmö', country: 'Sweden', lat: 55.6050, lon: 13.0038, weight: 0.01 },
  { city: 'Aarhus', country: 'Denmark', lat: 56.1629, lon: 10.2039, weight: 0.01 },
  { city: 'Bergen', country: 'Norway', lat: 60.3913, lon: 5.3221, weight: 0.01 },
  { city: 'Thessaloniki', country: 'Greece', lat: 40.6401, lon: 22.9444, weight: 0.01 },
  { city: 'Bucharest', country: 'Romania', lat: 44.4268, lon: 26.1025, weight: 0.01 },
  { city: 'Sofia', country: 'Bulgaria', lat: 42.6977, lon: 23.3219, weight: 0.01 },
  { city: 'Zagreb', country: 'Croatia', lat: 45.8150, lon: 15.9819, weight: 0.01 },
  { city: 'Bratislava', country: 'Slovakia', lat: 48.1486, lon: 17.1077, weight: 0.01 },
  { city: 'Ljubljana', country: 'Slovenia', lat: 46.0569, lon: 14.5058, weight: 0.01 },
  { city: 'Vilnius', country: 'Lithuania', lat: 54.6872, lon: 25.2797, weight: 0.01 },
  { city: 'Riga', country: 'Latvia', lat: 56.9496, lon: 24.1052, weight: 0.01 },
  { city: 'Tallinn', country: 'Estonia', lat: 59.4370, lon: 24.7536, weight: 0.01 },
  { city: 'Manchester', country: 'UK', lat: 53.4808, lon: -2.2426, weight: 0.01 },
  { city: 'Birmingham', country: 'UK', lat: 52.4862, lon: -1.8904, weight: 0.01 },
  { city: 'Glasgow', country: 'UK', lat: 55.8642, lon: -4.2518, weight: 0.01 },
  { city: 'Edinburgh', country: 'UK', lat: 55.9533, lon: -3.1883, weight: 0.01 },
  { city: 'Liverpool', country: 'UK', lat: 53.4084, lon: -2.9916, weight: 0.01 },
  { city: 'Leeds', country: 'UK', lat: 53.8008, lon: -1.5491, weight: 0.01 },
  { city: 'Sheffield', country: 'UK', lat: 53.3811, lon: -1.4701, weight: 0.01 },
  { city: 'Bristol', country: 'UK', lat: 51.4545, lon: -2.5879, weight: 0.01 },
  { city: 'Newcastle', country: 'UK', lat: 54.9783, lon: -1.6178, weight: 0.01 },
  { city: 'Leicester', country: 'UK', lat: 52.6369, lon: -1.1398, weight: 0.01 },
  { city: 'Nottingham', country: 'UK', lat: 52.9548, lon: -1.1581, weight: 0.01 },
  { city: 'Cardiff', country: 'UK', lat: 51.4816, lon: -3.1791, weight: 0.01 },
  { city: 'Belfast', country: 'UK', lat: 54.5973, lon: -5.9301, weight: 0.01 },
  { city: 'Bern', country: 'Switzerland', lat: 46.9480, lon: 7.4474, weight: 0.01 },
  { city: 'Basel', country: 'Switzerland', lat: 47.5596, lon: 7.5886, weight: 0.01 },
  { city: 'Lausanne', country: 'Switzerland', lat: 46.5197, lon: 6.6323, weight: 0.01 },
  { city: 'Luxembourg City', country: 'Luxembourg', lat: 49.6116, lon: 6.1319, weight: 0.01 },
  { city: 'Reykjavik', country: 'Iceland', lat: 64.1466, lon: -21.9426, weight: 0.01 },
  { city: 'Split', country: 'Croatia', lat: 43.5081, lon: 16.4402, weight: 0.01 },
  { city: 'Dubrovnik', country: 'Croatia', lat: 42.6507, lon: 18.0944, weight: 0.01 },
  { city: 'Salzburg', country: 'Austria', lat: 47.8095, lon: 13.0550, weight: 0.01 },
  { city: 'Innsbruck', country: 'Austria', lat: 47.2692, lon: 11.4041, weight: 0.01 },
  { city: 'Graz', country: 'Austria', lat: 47.0707, lon: 15.4395, weight: 0.01 },
  { city: 'Bremen', country: 'Germany', lat: 53.0793, lon: 8.8017, weight: 0.01 },
  { city: 'Bonn', country: 'Germany', lat: 50.7374, lon: 7.0982, weight: 0.01 },
  { city: 'Münster', country: 'Germany', lat: 51.9607, lon: 7.6261, weight: 0.01 },
  { city: 'Karlsruhe', country: 'Germany', lat: 49.0069, lon: 8.4037, weight: 0.01 },
  { city: 'Mannheim', country: 'Germany', lat: 49.4875, lon: 8.4660, weight: 0.01 },
  { city: 'Augsburg', country: 'Germany', lat: 48.3705, lon: 10.8978, weight: 0.01 },
  { city: 'Wiesbaden', country: 'Germany', lat: 50.0826, lon: 8.2400, weight: 0.01 },
  { city: 'Mönchengladbach', country: 'Germany', lat: 51.1805, lon: 6.4428, weight: 0.01 },
  { city: 'Braunschweig', country: 'Germany', lat: 52.2689, lon: 10.5268, weight: 0.01 },
  { city: 'Chemnitz', country: 'Germany', lat: 50.8278, lon: 12.9214, weight: 0.01 },
  { city: 'Aachen', country: 'Germany', lat: 50.7753, lon: 6.0839, weight: 0.01 },
  { city: 'Kiel', country: 'Germany', lat: 54.3233, lon: 10.1394, weight: 0.01 },
  { city: 'Halle', country: 'Germany', lat: 51.4969, lon: 11.9688, weight: 0.01 },
  { city: 'Magdeburg', country: 'Germany', lat: 52.1205, lon: 11.6276, weight: 0.01 },
  { city: 'Freiburg', country: 'Germany', lat: 47.9990, lon: 7.8421, weight: 0.01 },
  { city: 'Lübeck', country: 'Germany', lat: 53.8655, lon: 10.6866, weight: 0.01 },
  { city: 'Erfurt', country: 'Germany', lat: 50.9848, lon: 11.0299, weight: 0.01 },
  { city: 'Rostock', country: 'Germany', lat: 54.0887, lon: 12.1403, weight: 0.01 },
  { city: 'Utrecht', country: 'Netherlands', lat: 52.0907, lon: 5.1214, weight: 0.01 },
  { city: 'Eindhoven', country: 'Netherlands', lat: 51.4416, lon: 5.4697, weight: 0.01 },
  { city: 'Groningen', country: 'Netherlands', lat: 53.2194, lon: 6.5665, weight: 0.01 },
  { city: 'Tilburg', country: 'Netherlands', lat: 51.5555, lon: 5.0913, weight: 0.01 },
  { city: 'Almere', country: 'Netherlands', lat: 52.3508, lon: 5.2647, weight: 0.01 },
  { city: 'Breda', country: 'Netherlands', lat: 51.5719, lon: 4.7683, weight: 0.01 },
  { city: 'Nijmegen', country: 'Netherlands', lat: 51.8126, lon: 5.8372, weight: 0.01 },
  { city: 'Ghent', country: 'Belgium', lat: 51.0543, lon: 3.7174, weight: 0.01 },
  { city: 'Bruges', country: 'Belgium', lat: 51.2093, lon: 3.2247, weight: 0.01 },
  { city: 'Liège', country: 'Belgium', lat: 50.6292, lon: 5.5797, weight: 0.01 },
  { city: 'Charleroi', country: 'Belgium', lat: 50.4108, lon: 4.4446, weight: 0.01 },
  { city: 'Namur', country: 'Belgium', lat: 50.4674, lon: 4.8720, weight: 0.01 },
  { city: 'Leuven', country: 'Belgium', lat: 50.8798, lon: 4.7005, weight: 0.01 },
  { city: 'Rennes', country: 'France', lat: 48.1173, lon: -1.6778, weight: 0.01 },
  { city: 'Reims', country: 'France', lat: 49.2583, lon: 4.0317, weight: 0.01 },
  { city: 'Le Havre', country: 'France', lat: 49.4944, lon: 0.1079, weight: 0.01 },
  { city: 'Saint-Étienne', country: 'France', lat: 45.4397, lon: 4.3872, weight: 0.01 },
  { city: 'Toulon', country: 'France', lat: 43.1242, lon: 5.9280, weight: 0.01 },
  { city: 'Grenoble', country: 'France', lat: 45.1885, lon: 5.7245, weight: 0.01 },
  { city: 'Dijon', country: 'France', lat: 47.3220, lon: 5.0415, weight: 0.01 },
  { city: 'Angers', country: 'France', lat: 47.4784, lon: -0.5632, weight: 0.01 },
  { city: 'Montpellier', country: 'France', lat: 43.6108, lon: 3.8767, weight: 0.01 },
  { city: 'Clermont-Ferrand', country: 'France', lat: 45.7772, lon: 3.0870, weight: 0.01 },
  { city: 'Catania', country: 'Italy', lat: 37.5079, lon: 15.0830, weight: 0.01 },
  { city: 'Verona', country: 'Italy', lat: 45.4384, lon: 10.9916, weight: 0.01 },
  { city: 'Venice', country: 'Italy', lat: 45.4408, lon: 12.3155, weight: 0.01 },
  { city: 'Padua', country: 'Italy', lat: 45.4064, lon: 11.8768, weight: 0.01 },
  { city: 'Trieste', country: 'Italy', lat: 45.6495, lon: 13.7768, weight: 0.01 },
  { city: 'Taranto', country: 'Italy', lat: 40.4761, lon: 17.2303, weight: 0.01 },
  { city: 'Brescia', country: 'Italy', lat: 45.5416, lon: 10.2118, weight: 0.01 },
  { city: 'Parma', country: 'Italy', lat: 44.8015, lon: 10.3279, weight: 0.01 },
  { city: 'Prato', country: 'Italy', lat: 43.8777, lon: 11.1023, weight: 0.01 },
  { city: 'Modena', country: 'Italy', lat: 44.6471, lon: 10.9252, weight: 0.01 },
  { city: 'Reggio Calabria', country: 'Italy', lat: 38.1114, lon: 15.6619, weight: 0.01 },
  { city: 'Perugia', country: 'Italy', lat: 43.1107, lon: 12.3908, weight: 0.01 },
  { city: 'Łódź', country: 'Poland', lat: 51.7592, lon: 19.4560, weight: 0.01 },
  { city: 'Szczecin', country: 'Poland', lat: 53.4285, lon: 14.5528, weight: 0.01 },
  { city: 'Bydgoszcz', country: 'Poland', lat: 53.1235, lon: 18.0084, weight: 0.01 },
  { city: 'Lublin', country: 'Poland', lat: 51.2465, lon: 22.5684, weight: 0.01 },
  { city: 'Katowice', country: 'Poland', lat: 50.2649, lon: 19.0238, weight: 0.01 },
  { city: 'Gdynia', country: 'Poland', lat: 54.5189, lon: 18.5305, weight: 0.01 },
  { city: 'Uppsala', country: 'Sweden', lat: 59.8586, lon: 17.6389, weight: 0.01 },
  { city: 'Linköping', country: 'Sweden', lat: 58.4108, lon: 15.6214, weight: 0.01 },
  { city: 'Örebro', country: 'Sweden', lat: 59.2753, lon: 15.2134, weight: 0.01 },
  { city: 'Västerås', country: 'Sweden', lat: 59.6099, lon: 16.5448, weight: 0.01 },
  { city: 'Odense', country: 'Denmark', lat: 55.4038, lon: 10.4024, weight: 0.01 },
  { city: 'Aalborg', country: 'Denmark', lat: 57.0488, lon: 9.9217, weight: 0.01 },
  { city: 'Trondheim', country: 'Norway', lat: 63.4305, lon: 10.3951, weight: 0.01 },
  { city: 'Stavanger', country: 'Norway', lat: 58.9700, lon: 5.7331, weight: 0.01 },
  { city: 'Turku', country: 'Finland', lat: 60.4518, lon: 22.2666, weight: 0.01 },
  { city: 'Tampere', country: 'Finland', lat: 61.4978, lon: 23.7610, weight: 0.01 },
  { city: 'Oulu', country: 'Finland', lat: 65.0121, lon: 25.4651, weight: 0.01 },
  { city: 'Patras', country: 'Greece', lat: 38.2466, lon: 21.7346, weight: 0.01 },
  { city: 'Heraklion', country: 'Greece', lat: 35.3387, lon: 25.1442, weight: 0.01 },
  { city: 'Larissa', country: 'Greece', lat: 39.6390, lon: 22.4191, weight: 0.01 },
  { city: 'Cluj-Napoca', country: 'Romania', lat: 46.7712, lon: 23.6236, weight: 0.01 },
  { city: 'Timișoara', country: 'Romania', lat: 45.7489, lon: 21.2087, weight: 0.01 },
  { city: 'Iași', country: 'Romania', lat: 47.1585, lon: 27.6014, weight: 0.01 },
  { city: 'Plovdiv', country: 'Bulgaria', lat: 42.1354, lon: 24.7453, weight: 0.01 },
  { city: 'Varna', country: 'Bulgaria', lat: 43.2141, lon: 27.9147, weight: 0.01 },
  { city: 'Burgas', country: 'Bulgaria', lat: 42.5048, lon: 27.4626, weight: 0.01 },
  { city: 'Belgrade', country: 'Serbia', lat: 44.7866, lon: 20.4489, weight: 0.01 },
  { city: 'Sarajevo', country: 'Bosnia and Herzegovina', lat: 43.8563, lon: 18.4131, weight: 0.01 },
  { city: 'Skopje', country: 'North Macedonia', lat: 41.9973, lon: 21.4280, weight: 0.01 },
  { city: 'Tirana', country: 'Albania', lat: 41.3275, lon: 19.8187, weight: 0.01 },
  { city: 'Pristina', country: 'Kosovo', lat: 42.6629, lon: 21.1655, weight: 0.01 },
  { city: 'Podgorica', country: 'Montenegro', lat: 42.4304, lon: 19.2594, weight: 0.01 },
  { city: 'Nicosia', country: 'Cyprus', lat: 35.1856, lon: 33.3823, weight: 0.01 },
  { city: 'Valletta', country: 'Malta', lat: 35.8989, lon: 14.5146, weight: 0.01 },
  { city: 'Chisinau', country: 'Moldova', lat: 47.0105, lon: 28.8638, weight: 0.01 }
];

/**
 * Random offset function
 * urbanOffsetKm: smaller for urban
 * ruralOffsetKm: larger for rural
 */
function addRandomOffset(lat, lon, urbanOffsetKm = 5, ruralOffsetKm = 20) {
  const isUrban = Math.random() < 0.8; // 80% urban hospitals
  const offsetKm = isUrban ? urbanOffsetKm : ruralOffsetKm;
  const latOffset = (Math.random() - 0.5) * (offsetKm / 111);
  const lonOffset = (Math.random() - 0.5) * (offsetKm / (111 * Math.cos(lat * Math.PI / 180)));
  return {
    lat: parseFloat((lat + latOffset).toFixed(6)),
    lon: parseFloat((lon + lonOffset).toFixed(6))
  };
}

/**
 * Assign city to hospital using consistent hashing
 */
function assignCityToHospital(hospitalName) {
  let hash = 0;
  for (let i = 0; i < hospitalName.length; i++) {
    hash = ((hash << 5) - hash) + hospitalName.charCodeAt(i);
    hash |= 0;
  }

  const normalizedHash = Math.abs(hash % 1000) / 1000;
  let cumulativeWeight = 0;

  for (const city of europeanCities) {
    cumulativeWeight += city.weight;
    if (normalizedHash <= cumulativeWeight) return city;
  }

  return europeanCities[europeanCities.length - 1];
}

/**
 * Main function: enrich CSV with City, Country, Latitude, Longitude
 */
function addCoordinatesToCSV(inputFile, outputFile) {
  console.log('Reading CSV file...');
  const fileContent = fs.readFileSync(inputFile, 'utf8');
  const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });

  console.log(`Loaded ${parsed.data.length} rows`);

  const hospitalCoords = {};

  // Format function for dates
  function formatDate(date) {
  if (!date) return '';

  // Convert string to Date if necessary
  const d = date instanceof Date ? date : new Date(date);

  // If invalid date, return empty string
  if (isNaN(d.getTime())) return '';

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0'); // Month is 0-based
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

  const enrichedData = parsed.data.map(row => {
    const hospitalName = row.Hospital;

    // Assign coordinates if not already assigned
    if (!hospitalCoords[hospitalName]) {
      const baseCity = assignCityToHospital(hospitalName);
      const coords = addRandomOffset(baseCity.lat, baseCity.lon, 5, 20);

      hospitalCoords[hospitalName] = {
        city: baseCity.city,
        country: baseCity.country,
        latitude: coords.lat,
        longitude: coords.lon
      };
    }

    return {
      ...row,
      City: hospitalCoords[hospitalName].city,
      Country: hospitalCoords[hospitalName].country,
      Latitude: hospitalCoords[hospitalName].latitude,
      Longitude: hospitalCoords[hospitalName].longitude
    };
  });

  // Convert dates to YYYY-MM-DD when exporting to CSV
  const csv = Papa.unparse(
    enrichedData.map(row => ({
      ...row,
      'Date of Admission': formatDate(row['Date of Admission']),
      'Discharge Date': formatDate(row['Discharge Date'])
    }))
  );

  fs.writeFileSync(outputFile, csv);

  console.log(`\nAdded City, Country, Latitude, Longitude`);
  console.log(`Output saved: ${outputFile}`);
  console.log(`Total rows: ${enrichedData.length}`);
  console.log(`Unique hospitals: ${Object.keys(hospitalCoords).length}`);

  return enrichedData;
}

// Usage
const inputFile = '../data/healthcare_dataset_cleaned.csv';
const outputFile = '../data/healthcare_dataset_with_coords.csv';
addCoordinatesToCSV(inputFile, outputFile);

export { addCoordinatesToCSV };
