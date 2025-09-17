// Base de données des villes françaises avec codes postaux
export interface FrenchCity {
  nom: string
  codePostal: string
  codeCommune: string
  departement: string
  region: string
  latitude?: number
  longitude?: number
}

// Base de données des principales villes françaises
export const FRENCH_CITIES: FrenchCity[] = [
  // Paris et Île-de-France
  { nom: "Paris", codePostal: "75001", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75002", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75003", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75004", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75005", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75006", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75007", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75008", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75009", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75010", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75011", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75012", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75013", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75014", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75015", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75016", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75017", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75018", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75019", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Paris", codePostal: "75020", codeCommune: "75056", departement: "Paris", region: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
  
  // Villes principales
  { nom: "Lyon", codePostal: "69001", codeCommune: "69123", departement: "Rhône", region: "Auvergne-Rhône-Alpes", latitude: 45.7640, longitude: 4.8357 },
  { nom: "Lyon", codePostal: "69002", codeCommune: "69123", departement: "Rhône", region: "Auvergne-Rhône-Alpes", latitude: 45.7640, longitude: 4.8357 },
  { nom: "Lyon", codePostal: "69003", codeCommune: "69123", departement: "Rhône", region: "Auvergne-Rhône-Alpes", latitude: 45.7640, longitude: 4.8357 },
  { nom: "Lyon", codePostal: "69004", codeCommune: "69123", departement: "Rhône", region: "Auvergne-Rhône-Alpes", latitude: 45.7640, longitude: 4.8357 },
  { nom: "Lyon", codePostal: "69005", codeCommune: "69123", departement: "Rhône", region: "Auvergne-Rhône-Alpes", latitude: 45.7640, longitude: 4.8357 },
  { nom: "Lyon", codePostal: "69006", codeCommune: "69123", departement: "Rhône", region: "Auvergne-Rhône-Alpes", latitude: 45.7640, longitude: 4.8357 },
  { nom: "Lyon", codePostal: "69007", codeCommune: "69123", departement: "Rhône", region: "Auvergne-Rhône-Alpes", latitude: 45.7640, longitude: 4.8357 },
  { nom: "Lyon", codePostal: "69008", codeCommune: "69123", departement: "Rhône", region: "Auvergne-Rhône-Alpes", latitude: 45.7640, longitude: 4.8357 },
  { nom: "Lyon", codePostal: "69009", codeCommune: "69123", departement: "Rhône", region: "Auvergne-Rhône-Alpes", latitude: 45.7640, longitude: 4.8357 },
  
  { nom: "Marseille", codePostal: "13001", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13002", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13003", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13004", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13005", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13006", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13007", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13008", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13009", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13010", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13011", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13012", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13013", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13014", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13015", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13016", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  
  // Autres grandes villes
  { nom: "Toulouse", codePostal: "31000", codeCommune: "31555", departement: "Haute-Garonne", region: "Occitanie", latitude: 43.6047, longitude: 1.4442 },
  { nom: "Nice", codePostal: "06000", codeCommune: "06088", departement: "Alpes-Maritimes", region: "Provence-Alpes-Côte d'Azur", latitude: 43.7102, longitude: 7.2620 },
  { nom: "Nantes", codePostal: "44000", codeCommune: "44109", departement: "Loire-Atlantique", region: "Pays de la Loire", latitude: 47.2184, longitude: -1.5536 },
  { nom: "Montpellier", codePostal: "34000", codeCommune: "34172", departement: "Hérault", region: "Occitanie", latitude: 43.6110, longitude: 3.8767 },
  { nom: "Strasbourg", codePostal: "67000", codeCommune: "67482", departement: "Bas-Rhin", region: "Grand Est", latitude: 48.5734, longitude: 7.7521 },
  { nom: "Bordeaux", codePostal: "33000", codeCommune: "33063", departement: "Gironde", region: "Nouvelle-Aquitaine", latitude: 44.8378, longitude: -0.5792 },
  { nom: "Lille", codePostal: "59000", codeCommune: "59350", departement: "Nord", region: "Hauts-de-France", latitude: 50.6292, longitude: 3.0573 },
  { nom: "Rennes", codePostal: "35000", codeCommune: "35238", departement: "Ille-et-Vilaine", region: "Bretagne", latitude: 48.1173, longitude: -1.6778 },
  { nom: "Reims", codePostal: "51000", codeCommune: "51454", departement: "Marne", region: "Grand Est", latitude: 49.2583, longitude: 4.0317 },
  { nom: "Le Havre", codePostal: "76600", codeCommune: "76351", departement: "Seine-Maritime", region: "Normandie", latitude: 49.4944, longitude: 0.1079 },
  { nom: "Saint-Étienne", codePostal: "42000", codeCommune: "42218", departement: "Loire", region: "Auvergne-Rhône-Alpes", latitude: 45.4397, longitude: 4.3872 },
  { nom: "Toulon", codePostal: "83000", codeCommune: "83137", departement: "Var", region: "Provence-Alpes-Côte d'Azur", latitude: 43.1242, longitude: 5.9280 },
  { nom: "Grenoble", codePostal: "38000", codeCommune: "38185", departement: "Isère", region: "Auvergne-Rhône-Alpes", latitude: 45.1885, longitude: 5.7245 },
  { nom: "Dijon", codePostal: "21000", codeCommune: "21231", departement: "Côte-d'Or", region: "Bourgogne-Franche-Comté", latitude: 47.3220, longitude: 5.0415 },
  { nom: "Angers", codePostal: "49000", codeCommune: "49007", departement: "Maine-et-Loire", region: "Pays de la Loire", latitude: 47.4784, longitude: -0.5632 },
  { nom: "Nîmes", codePostal: "30000", codeCommune: "30189", departement: "Gard", region: "Occitanie", latitude: 43.8367, longitude: 4.3601 },
  { nom: "Villeurbanne", codePostal: "69100", codeCommune: "69266", departement: "Rhône", region: "Auvergne-Rhône-Alpes", latitude: 45.7667, longitude: 4.8833 },
  
  // Villes commençant par MAR
  { nom: "Marcq-en-Barœul", codePostal: "59700", codeCommune: "59378", departement: "Nord", region: "Hauts-de-France", latitude: 50.6667, longitude: 3.0833 },
  { nom: "Marignane", codePostal: "13700", codeCommune: "13054", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.4167, longitude: 5.2167 },
  { nom: "Martigues", codePostal: "13500", codeCommune: "13056", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.4167, longitude: 5.0500 },
  { nom: "Mantes-la-Jolie", codePostal: "78200", codeCommune: "78361", departement: "Yvelines", region: "Île-de-France", latitude: 48.9833, longitude: 1.7167 },
  { nom: "Marne-la-Vallée", codePostal: "77420", codeCommune: "77004", departement: "Seine-et-Marne", region: "Île-de-France", latitude: 48.8500, longitude: 2.5833 },
  { nom: "Marly-le-Roi", codePostal: "78160", codeCommune: "78372", departement: "Yvelines", region: "Île-de-France", latitude: 48.8667, longitude: 2.0833 },
  { nom: "Marcoussis", codePostal: "91460", codeCommune: "91360", departement: "Essonne", region: "Île-de-France", latitude: 48.6333, longitude: 2.2333 },
  { nom: "Marolles-en-Brie", codePostal: "77120", codeCommune: "77276", departement: "Seine-et-Marne", region: "Île-de-France", latitude: 48.7667, longitude: 3.1333 },
  { nom: "Massy", codePostal: "91300", codeCommune: "91377", departement: "Essonne", region: "Île-de-France", latitude: 48.7333, longitude: 2.2833 },
  { nom: "Marseille", codePostal: "13017", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13018", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13019", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  { nom: "Marseille", codePostal: "13020", codeCommune: "13055", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698 },
  
  // Plus de villes pour avoir une base plus complète
  { nom: "Aix-en-Provence", codePostal: "13100", codeCommune: "13001", departement: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur", latitude: 43.5263, longitude: 5.4454 },
  { nom: "Amiens", codePostal: "80000", codeCommune: "80021", departement: "Somme", region: "Hauts-de-France", latitude: 49.8943, longitude: 2.2958 },
  { nom: "Annecy", codePostal: "74000", codeCommune: "74010", departement: "Haute-Savoie", region: "Auvergne-Rhône-Alpes", latitude: 45.8992, longitude: 6.1294 },
  { nom: "Avignon", codePostal: "84000", codeCommune: "84007", departement: "Vaucluse", region: "Provence-Alpes-Côte d'Azur", latitude: 43.9493, longitude: 4.8055 },
  { nom: "Besançon", codePostal: "25000", codeCommune: "25056", departement: "Doubs", region: "Bourgogne-Franche-Comté", latitude: 47.2380, longitude: 6.0243 },
  { nom: "Brest", codePostal: "29200", codeCommune: "29019", departement: "Finistère", region: "Bretagne", latitude: 48.3905, longitude: -4.4860 },
  { nom: "Caen", codePostal: "14000", codeCommune: "14118", departement: "Calvados", region: "Normandie", latitude: 49.1829, longitude: -0.3707 },
  { nom: "Clermont-Ferrand", codePostal: "63000", codeCommune: "63113", departement: "Puy-de-Dôme", region: "Auvergne-Rhône-Alpes", latitude: 45.7772, longitude: 3.0870 },
  { nom: "Dunkerque", codePostal: "59140", codeCommune: "59183", departement: "Nord", region: "Hauts-de-France", latitude: 51.0344, longitude: 2.3768 },
  { nom: "Le Mans", codePostal: "72000", codeCommune: "72181", departement: "Sarthe", region: "Pays de la Loire", latitude: 48.0061, longitude: 0.1996 },
  { nom: "Limoges", codePostal: "87000", codeCommune: "87085", departement: "Haute-Vienne", region: "Nouvelle-Aquitaine", latitude: 45.8336, longitude: 1.2611 },
  { nom: "Metz", codePostal: "57000", codeCommune: "57463", departement: "Moselle", region: "Grand Est", latitude: 49.1193, longitude: 6.1757 },
  { nom: "Mulhouse", codePostal: "68100", codeCommune: "68224", departement: "Haut-Rhin", region: "Grand Est", latitude: 47.7508, longitude: 7.3359 },
  { nom: "Nancy", codePostal: "54000", codeCommune: "54395", departement: "Meurthe-et-Moselle", region: "Grand Est", latitude: 48.6921, longitude: 6.1844 },
  { nom: "Orléans", codePostal: "45000", codeCommune: "45234", departement: "Loiret", region: "Centre-Val de Loire", latitude: 47.9029, longitude: 1.9093 },
  { nom: "Perpignan", codePostal: "66000", codeCommune: "66136", departement: "Pyrénées-Orientales", region: "Occitanie", latitude: 42.6886, longitude: 2.8948 },
  { nom: "Poitiers", codePostal: "86000", codeCommune: "86194", departement: "Vienne", region: "Nouvelle-Aquitaine", latitude: 46.5802, longitude: 0.3404 },
  { nom: "Rouen", codePostal: "76000", codeCommune: "76540", departement: "Seine-Maritime", region: "Normandie", latitude: 49.4432, longitude: 1.0993 },
  { nom: "Saint-Denis", codePostal: "93200", codeCommune: "93066", departement: "Seine-Saint-Denis", region: "Île-de-France", latitude: 48.9362, longitude: 2.3574 },
  { nom: "Tours", codePostal: "37000", codeCommune: "37261", departement: "Indre-et-Loire", region: "Centre-Val de Loire", latitude: 47.3941, longitude: 0.6848 },
  { nom: "Valence", codePostal: "26000", codeCommune: "26362", departement: "Drôme", region: "Auvergne-Rhône-Alpes", latitude: 44.9333, longitude: 4.8833 },
  { nom: "Versailles", codePostal: "78000", codeCommune: "78646", departement: "Yvelines", region: "Île-de-France", latitude: 48.8014, longitude: 2.1301 },
]

// Fonction pour rechercher des villes
export function searchFrenchCities(query: string, limit: number = 15): FrenchCity[] {
  if (!query || query.length < 2) return []
  
  const normalizedQuery = query.toLowerCase().trim()
  
  return FRENCH_CITIES
    .filter(city => 
      city.nom.toLowerCase().startsWith(normalizedQuery) ||
      city.nom.toLowerCase().includes(normalizedQuery) ||
      city.codePostal.includes(query) ||
      city.departement.toLowerCase().includes(normalizedQuery) ||
      city.region.toLowerCase().includes(normalizedQuery)
    )
    .sort((a, b) => {
      // Prioriser les villes qui commencent par la requête
      const aStartsWith = a.nom.toLowerCase().startsWith(normalizedQuery)
      const bStartsWith = b.nom.toLowerCase().startsWith(normalizedQuery)
      
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      
      // Puis trier par nom
      return a.nom.localeCompare(b.nom)
    })
    .slice(0, limit)
}

// Fonction pour calculer la distance entre deux points (formule de Haversine)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Fonction pour trouver les villes dans un rayon donné
export function findCitiesInRadius(
  centerCity: FrenchCity, 
  radiusKm: number, 
  allCities: FrenchCity[] = FRENCH_CITIES
): FrenchCity[] {
  return allCities
    .filter(city => {
      if (!city.latitude || !city.longitude || !centerCity.latitude || !centerCity.longitude) return false
      const distance = calculateDistance(
        centerCity.latitude, 
        centerCity.longitude, 
        city.latitude, 
        city.longitude
      )
      return distance <= radiusKm
    })
    .sort((a, b) => {
      if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return 0
      const distA = calculateDistance(centerCity.latitude!, centerCity.longitude!, a.latitude, a.longitude)
      const distB = calculateDistance(centerCity.latitude!, centerCity.longitude!, b.latitude, b.longitude)
      return distA - distB
    })
}
