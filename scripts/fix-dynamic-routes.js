const fs = require('fs');
const path = require('path');

// Fonction pour ajouter export const dynamic = 'force-dynamic' aux routes API
function addDynamicExport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier si le fichier contient déjà l'export dynamic
    if (content.includes("export const dynamic = 'force-dynamic'")) {
      return false; // Déjà présent
    }
    
    // Vérifier si c'est un fichier route.ts
    if (!filePath.endsWith('/route.ts')) {
      return false;
    }
    
    // Vérifier si le fichier utilise des fonctionnalités dynamiques
    const hasDynamicUsage = content.includes('request.url') || 
                           content.includes('request.headers') || 
                           content.includes('request.cookies');
    
    if (!hasDynamicUsage) {
      return false;
    }
    
    // Trouver la position après les imports
    const lines = content.split('\n');
    let insertIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith('const ') || lines[i].startsWith('let ') || lines[i].startsWith('var ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '' && insertIndex > 0) {
        // Ligne vide après les imports
        insertIndex = i + 1;
        break;
      } else if (lines[i].startsWith('export ') && !lines[i].includes('export const dynamic')) {
        // Premier export, insérer avant
        insertIndex = i;
        break;
      }
    }
    
    // Insérer l'export dynamic
    lines.splice(insertIndex, 0, '', "export const dynamic = 'force-dynamic'");
    
    // Écrire le fichier modifié
    fs.writeFileSync(filePath, lines.join('\n'));
    return true;
  } catch (error) {
    console.error(`Erreur lors du traitement de ${filePath}:`, error.message);
    return false;
  }
}

// Fonction récursive pour parcourir les dossiers
function walkDirectory(dir, callback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath, callback);
    } else if (file === 'route.ts') {
      callback(filePath);
    }
  }
}

// Parcourir le dossier app/api
const apiDir = path.join(__dirname, '..', 'app', 'api');
let modifiedCount = 0;

console.log('🔧 Ajout de export const dynamic = "force-dynamic" aux routes API...');

walkDirectory(apiDir, (filePath) => {
  const relativePath = path.relative(process.cwd(), filePath);
  if (addDynamicExport(filePath)) {
    console.log(`✅ Modifié: ${relativePath}`);
    modifiedCount++;
  }
});

console.log(`\n🎉 Terminé! ${modifiedCount} fichiers modifiés.`);
