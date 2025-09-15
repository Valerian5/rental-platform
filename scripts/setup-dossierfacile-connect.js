const fs = require('fs')
const path = require('path')

console.log('🔧 Configuration DossierFacile Connect')
console.log('=====================================')

// Variables d'environnement nécessaires pour DossierFacile Connect
const requiredEnvVars = {
  // Identifiants OAuth2 (à obtenir auprès de DossierFacile)
  DOSSIERFACILE_CLIENT_ID: 'your_client_id_here',
  DOSSIERFACILE_CLIENT_SECRET: 'your_client_secret_here',
  
  // URL de base de votre application
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', // ou votre domaine de production
  
  // URLs DossierFacile (ne pas modifier)
  DOSSIERFACILE_AUTH_URL_PREPROD: 'https://sso-preprod.dossierfacile.fr/auth/realms/dossier-facile/protocol/openid-connect/auth',
  DOSSIERFACILE_TOKEN_URL_PREPROD: 'https://sso-preprod.dossierfacile.fr/auth/realms/dossier-facile/protocol/openid-connect/token',
  DOSSIERFACILE_API_URL_PREPROD: 'https://api-preprod.dossierfacile.fr/dfc/tenant/profile',
  
  DOSSIERFACILE_AUTH_URL_PROD: 'https://sso.dossierfacile.fr/auth/realms/dossier-facile/protocol/openid-connect/auth',
  DOSSIERFACILE_TOKEN_URL_PROD: 'https://sso.dossierfacile.fr/auth/realms/dossier-facile/protocol/openid-connect/token',
  DOSSIERFACILE_API_URL_PROD: 'https://api.dossierfacile.fr/dfc/tenant/profile',
}

// Lire le fichier .env.local existant
const envPath = path.join(process.cwd(), '.env.local')
let existingEnv = ''

if (fs.existsSync(envPath)) {
  existingEnv = fs.readFileSync(envPath, 'utf8')
  console.log('📄 Fichier .env.local existant trouvé')
} else {
  console.log('📄 Création du fichier .env.local')
}

// Ajouter les variables DossierFacile si elles n'existent pas déjà
let updatedEnv = existingEnv
let addedVars = []

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!existingEnv.includes(`${key}=`)) {
    updatedEnv += `\n# DossierFacile Connect\n${key}=${value}\n`
    addedVars.push(key)
  }
})

// Écrire le fichier mis à jour
fs.writeFileSync(envPath, updatedEnv)

console.log('\n✅ Configuration terminée !')
console.log(`📝 ${addedVars.length} variables ajoutées au fichier .env.local`)

if (addedVars.length > 0) {
  console.log('\n🔧 Variables ajoutées :')
  addedVars.forEach(key => {
    console.log(`   - ${key}`)
  })
}

console.log('\n📋 Prochaines étapes :')
console.log('1. Obtenez vos identifiants OAuth2 auprès de DossierFacile :')
console.log('   - Contactez : https://partenaire.dossierfacile.logement.gouv.fr/documentation-technique/dossierfacile-connect')
console.log('   - Demandez un accès à la préproduction')
console.log('   - Fournissez votre URL de callback : http://localhost:3000/api/dossierfacile/callback')
console.log('   - Fournissez votre URL de webhook (optionnel) : http://localhost:3000/api/dossierfacile/webhook')
console.log('')
console.log('2. Mettez à jour .env.local avec vos vrais identifiants :')
console.log('   - DOSSIERFACILE_CLIENT_ID=your_real_client_id')
console.log('   - DOSSIERFACILE_CLIENT_SECRET=your_real_client_secret')
console.log('   - NEXT_PUBLIC_SITE_URL=https://your-domain.com (pour la production)')
console.log('')
console.log('3. Testez l\'intégration :')
console.log('   - Démarrez votre application : npm run dev')
console.log('   - Allez sur /tenant/profile/rental-file')
console.log('   - Cliquez sur "Se connecter à DossierFacile"')
console.log('')
console.log('4. Pour la production, configurez également :')
console.log('   - Vos URLs de callback et webhook en production')
console.log('   - Les identifiants de production DossierFacile')
console.log('   - La variable NODE_ENV=production')

console.log('\n🎉 Configuration DossierFacile Connect terminée !')
