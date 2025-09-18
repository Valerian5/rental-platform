import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Home, Building, UserCheck, Phone, User, Settings, MessageSquare, BarChart3, Heart } from "lucide-react"
import { FavoritesTest } from "@/components/favorites-test"
import { ApplicationStatusTest } from "@/components/application-status-test"

export default function NavigationPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Louer Ici - Navigation</h1>
          <p className="text-xl text-gray-600">Accédez à toutes les fonctionnalités de la plateforme</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Page d'accueil */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-600" />
                Page d'accueil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Page principale du site avec présentation et recherche</p>
              <Button asChild className="w-full">
                <Link href="/">Voir la page</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Gestion des biens */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-green-600" />
                Gestion des biens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Interface de gestion des propriétés immobilières</p>
              <Button asChild className="w-full">
                <Link href="/property-management">Voir la page</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Annonces */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-600" />
                Annonces
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Liste des biens disponibles à la location</p>
              <Button asChild className="w-full">
                <Link href="/properties">Voir la page</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Tableau de bord locataire */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Dashboard Locataire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Espace personnel pour les locataires</p>
              <Button asChild className="w-full">
                <Link href="/tenant/dashboard">Voir la page</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Tableau de bord propriétaire */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                Dashboard Propriétaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Espace personnel pour les propriétaires</p>
              <Button asChild className="w-full">
                <Link href="/owner/dashboard">Voir la page</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Messagerie */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-orange-600" />
                Messagerie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Système de communication entre utilisateurs</p>
              <Button asChild className="w-full">
                <Link href="/messaging">Voir la page</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Administration */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-red-600" />
                Administration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Interface d'administration du site</p>
              <Button asChild className="w-full">
                <Link href="/admin">Voir la page</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Tableaux de bord et statistiques</p>
              <Button asChild className="w-full">
                <Link href="/owner/statistics">Voir la page</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-teal-600" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Page de contact et support</p>
              <Button asChild className="w-full">
                <Link href="/contact">Voir la page</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Favoris */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                Favoris
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Gestion des biens favoris pour les locataires</p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/favorites">Favoris publics</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/tenant/favorites">Favoris locataire</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

    {/* Test API Favoris */}
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-blue-600" />
          Test API Favoris
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FavoritesTest />
      </CardContent>
    </Card>

    {/* Test Badge Candidature */}
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-green-600" />
          Test Badge Candidature
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ApplicationStatusTest />
      </CardContent>
    </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Cette page de navigation vous permet d'accéder à toutes les fonctionnalités développées.
            <br />
            En production, les utilisateurs accéderont directement à la page d'accueil.
          </p>
        </div>
      </div>
    </div>
  )
}