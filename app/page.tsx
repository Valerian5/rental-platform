import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, HomeIcon, UserIcon, FileTextIcon, MessageSquareIcon } from "lucide-react"

export default function HomePage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4">Plateforme de Location Immobilière</h1>
        <p className="text-xl text-muted-foreground">
          Solution complète de mise en relation entre propriétaires et locataires
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Gestion des Utilisateurs
            </CardTitle>
            <CardDescription>Inscription et gestion des profils locataires et propriétaires</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Inscription avec rôles spécifiques</li>
              <li>Profils personnalisés par type d'utilisateur</li>
              <li>Gestion des documents et justificatifs</li>
              <li>Tableaux de bord adaptés</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/user-management" className="w-full">
              <Button variant="outline" className="w-full">
                Voir le module
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HomeIcon className="h-5 w-5" />
              Gestion des Biens
            </CardTitle>
            <CardDescription>Création et gestion des annonces immobilières</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Création d'annonces détaillées</li>
              <li>Système de recherche avancée</li>
              <li>Filtres personnalisés</li>
              <li>Gestion des favoris</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/property-management" className="w-full">
              <Button variant="outline" className="w-full">
                Voir le module
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5" />
              Dossiers de Location
            </CardTitle>
            <CardDescription>Gestion des candidatures et dossiers</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Création de dossiers complets</li>
              <li>Système de scoring automatique</li>
              <li>Suivi des candidatures</li>
              <li>Gestion des documents</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/application-management" className="w-full">
              <Button variant="outline" className="w-full">
                Voir le module
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Planification des Visites
            </CardTitle>
            <CardDescription>Système de rendez-vous et visites</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Calendrier interactif (FullCalendar)</li>
              <li>Gestion des disponibilités</li>
              <li>Visites individuelles ou groupées</li>
              <li>Notifications automatiques</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/visit-scheduling" className="w-full">
              <Button variant="secondary" className="w-full">
                Explorer en détail
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareIcon className="h-5 w-5" />
              Communication
            </CardTitle>
            <CardDescription>Messagerie et notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Messagerie intégrée</li>
              <li>Notifications en temps réel</li>
              <li>Historique des échanges</li>
              <li>Modèles de messages</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/communication" className="w-full">
              <Button variant="outline" className="w-full">
                Voir le module
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5" />
              Gestion des Baux
            </CardTitle>
            <CardDescription>Création et suivi des contrats</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Génération de baux personnalisés</li>
              <li>Signature électronique</li>
              <li>Gestion des quittances</li>
              <li>Suivi des incidents locatifs</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/lease-management" className="w-full">
              <Button variant="outline" className="w-full">
                Voir le module
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
