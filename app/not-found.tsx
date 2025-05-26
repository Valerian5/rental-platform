import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-9xl font-bold text-blue-600">404</h1>
      <h2 className="text-3xl font-bold mt-4 mb-6">Page non trouvée</h2>
      <p className="text-xl text-muted-foreground max-w-md mb-8">
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Button asChild size="lg">
        <Link href="/">
          <Home className="mr-2 h-5 w-5" />
          Retour à l'accueil
        </Link>
      </Button>
    </div>
  )
}
