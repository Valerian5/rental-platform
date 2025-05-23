import { Mail, Phone, MapPin, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContactPage() {
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Contactez-nous</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Vous avez des questions ou besoin d'informations ? Notre équipe est à votre disposition pour vous aider.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <Card>
          <CardHeader className="text-center">
            <Phone className="h-10 w-10 mx-auto mb-2 text-blue-600" />
            <CardTitle>Téléphone</CardTitle>
            <CardDescription>Appelez-nous directement</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="font-medium text-lg">+33 1 23 45 67 89</p>
            <p className="text-sm text-muted-foreground mt-1">Lun-Ven, 9h-18h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Mail className="h-10 w-10 mx-auto mb-2 text-blue-600" />
            <CardTitle>Email</CardTitle>
            <CardDescription>Écrivez-nous à tout moment</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="font-medium text-lg">contact@rental-platform.com</p>
            <p className="text-sm text-muted-foreground mt-1">Nous répondons sous 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <MapPin className="h-10 w-10 mx-auto mb-2 text-blue-600" />
            <CardTitle>Adresse</CardTitle>
            <CardDescription>Venez nous rencontrer</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="font-medium text-lg">123 Avenue des Champs-Élysées</p>
            <p className="text-sm text-muted-foreground mt-1">75008 Paris, France</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-6">Envoyez-nous un message</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nom
                </label>
                <Input id="name" placeholder="Votre nom" />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input id="email" type="email" placeholder="Votre email" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Sujet
              </label>
              <Input id="subject" placeholder="Sujet de votre message" />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <Textarea id="message" placeholder="Votre message" rows={6} />
            </div>

            <Button type="submit" className="w-full md:w-auto">
              <Send className="h-4 w-4 mr-2" />
              Envoyer le message
            </Button>
          </form>
        </div>

        <div className="flex items-center justify-center">
          <div className="aspect-square w-full max-w-md bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center p-8">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Carte de localisation</p>
              <p className="font-medium mt-2">123 Avenue des Champs-Élysées, 75008 Paris</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6 text-center">Questions fréquentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comment puis-je mettre mon bien en location ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Pour mettre votre bien en location, inscrivez-vous en tant que propriétaire, puis suivez les étapes pour
                ajouter votre bien. Notre équipe validera votre annonce avant sa publication.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quels sont les frais de gestion ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Nos frais de gestion varient selon le niveau de service choisi. Ils sont généralement compris entre 5%
                et 8% du loyer mensuel. Contactez-nous pour obtenir un devis personnalisé.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comment se déroule la visite d'un bien ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Après avoir sélectionné un bien qui vous intéresse, vous pouvez demander une visite via notre
                plateforme. Nous coordonnons ensuite un rendez-vous avec le propriétaire ou notre agent immobilier.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comment sont gérés les paiements de loyer ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Les paiements de loyer peuvent être effectués directement via notre plateforme sécurisée. Nous proposons
                plusieurs options : prélèvement automatique, virement bancaire ou paiement par carte.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
