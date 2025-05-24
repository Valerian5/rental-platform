import Link from "next/link"
import { Search, FileText, CheckCircle, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Louer Ici
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/properties" className="text-gray-600 hover:text-blue-600">
                Annonces
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-blue-600">
                À propos
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-blue-600">
                Contact
              </Link>
            </nav>
            <div className="flex space-x-4">
              <Button variant="outline" asChild>
                <Link href="/auth/login">Connexion</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Inscription</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 opacity-90" />
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=1200')] bg-cover bg-center mix-blend-overlay" />
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Louer Ici</h1>
          <p className="text-xl md:text-2xl mb-2">La plateforme qui facilite la mise en relation</p>
          <p className="text-lg md:text-xl mb-8 opacity-90">entre propriétaires bailleurs et candidats locataires</p>

          <div className="bg-white rounded-lg p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select defaultValue="all">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type de bien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les biens</SelectItem>
                  <SelectItem value="apartment">Appartement</SelectItem>
                  <SelectItem value="house">Maison</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type de location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="unfurnished">Non meublé</SelectItem>
                  <SelectItem value="furnished">Meublé</SelectItem>
                  <SelectItem value="colocation">Colocation</SelectItem>
                </SelectContent>
              </Select>

              <Input type="text" placeholder="Ville" className="flex-1" />

              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/tenant/register">Je cherche un logement</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-blue-600"
              asChild
            >
              <Link href="/owner/register">Je loue mon bien</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Comment ça marche ?</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Pour les locataires */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-blue-600">Pour les locataires</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Créez votre profil et vos critères de recherche</h4>
                    <p className="text-muted-foreground">
                      Définissez vos préférences : ville, type de bien, budget, équipements...
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Constituez votre dossier de location</h4>
                    <p className="text-muted-foreground">
                      Ajoutez vos justificatifs une seule fois pour postuler rapidement
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Postulez aux annonces qui vous intéressent</h4>
                    <p className="text-muted-foreground">
                      Un clic suffit pour envoyer votre dossier complet au propriétaire
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Organisez vos visites et signez votre bail</h4>
                    <p className="text-muted-foreground">Gérez tout depuis votre tableau de bord personnel</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pour les propriétaires */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-green-600">Pour les propriétaires</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Créez votre annonce détaillée</h4>
                    <p className="text-muted-foreground">Décrivez votre bien et définissez vos critères de sélection</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Recevez des candidatures qualifiées</h4>
                    <p className="text-muted-foreground">
                      Notre système de matching vous propose les meilleurs profils
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Sélectionnez et organisez les visites</h4>
                    <p className="text-muted-foreground">Consultez les dossiers complets et planifiez facilement</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Gérez votre location en toute simplicité</h4>
                    <p className="text-muted-foreground">Quittances, incidents, révisions... tout est centralisé</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Pourquoi choisir Louer Ici ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <CardTitle>Dossiers vérifiés</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Tous les dossiers de location sont vérifiés pour garantir leur authenticité</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Star className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                <CardTitle>Matching intelligent</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Notre algorithme met en relation les profils compatibles selon vos critères</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <FileText className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                <CardTitle>Gestion simplifiée</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Tous vos documents et démarches centralisés dans un seul espace</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Louer Ici</h3>
              <p className="text-gray-400">La plateforme qui simplifie la location immobilière pour tous.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liens utiles</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/properties" className="hover:text-white">
                    Annonces
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white">
                    À propos
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Aide
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/legal" className="hover:text-white">
                    Mentions légales
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">
                Email: contact@louer-ici.fr
                <br />
                Téléphone: 01 23 45 67 89
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Louer Ici. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
