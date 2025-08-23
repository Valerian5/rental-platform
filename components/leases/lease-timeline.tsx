import { CheckCircle, FileText, Mail, PenSquare, Calendar, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Définition d'une interface plus stricte pour l'objet lease attendu
interface LeaseTimelineProps {
  lease: {
    created_at: string;
    sent_to_tenant_at?: string | null;
    docusign_sent_at?: string | null;
    docusign_completed_at?: string | null;
    docusign_status?: string | null;
    start_date: string;
  };
}

/**
 * Affiche une timeline verticale des événements clés d'un bail.
 * @param {LeaseTimelineProps} props - Les propriétés du composant, incluant l'objet lease.
 */
const LeaseTimeline = ({ lease }: LeaseTimelineProps) => {
  // Création d'une liste d'événements à afficher dans la timeline
  const timelineEvents = [
    {
      title: 'Création du bail',
      date: lease.created_at,
      description: 'Le brouillon du bail a été créé.',
      isCompleted: !!lease.created_at,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      title: 'Envoi au locataire pour relecture',
      date: lease.sent_to_tenant_at,
      description: 'Le bail a été envoyé au locataire pour validation avant signature.',
      isCompleted: !!lease.sent_to_tenant_at,
      icon: <Mail className="h-4 w-4" />,
    },
    {
      title: 'Envoi pour Signature Électronique',
      date: lease.docusign_sent_at,
      description: `Contrat envoyé pour signature via DocuSign.`,
      isCompleted: !!lease.docusign_sent_at,
      icon: <Send className="h-4 w-4" />,
    },
    {
      title: 'Contrat Signé et Actif',
      date: lease.docusign_completed_at,
      description: 'Le contrat a été signé par toutes les parties et est maintenant actif.',
      isCompleted: lease.docusign_status === 'completed', // DocuSign renvoie les statuts en minuscules
      icon: <PenSquare className="h-4 w-4" />,
    },
    {
      title: 'Début du bail',
      date: lease.start_date,
      description: 'Le bail est officiellement entré en vigueur.',
      // L'événement est considéré comme "complété" si la date de début est passée
      isCompleted: new Date(lease.start_date) <= new Date(),
      icon: <Calendar className="h-4 w-4" />,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique du bail</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6">
          {/* Ligne verticale de la timeline */}
          <div className="absolute left-9 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
          
          {/* On filtre pour n'afficher que les événements qui ont une date */}
          {timelineEvents
            .filter(event => event.date)
            .map((event, index) => (
            <div key={index} className="flex items-start mb-8">
              {/* Point et icône sur la timeline */}
              <div className="absolute left-9 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center z-10 bg-white dark:bg-gray-800">
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center ${event.isCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    {event.isCompleted ? <CheckCircle className="h-4 w-4" /> : event.icon}
                </div>
              </div>

              {/* Contenu de l'événement */}
              <div className="ml-8">
                <h4 className="font-semibold">{event.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(event.date!).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm mt-1">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaseTimeline;
