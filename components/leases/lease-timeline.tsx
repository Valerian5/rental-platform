import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, FileText, Mail, PenSquare, Calendar } from 'lucide-react';

interface TimelineEvent {
  id: string
  date: string
  type: "created" | "signed" | "payment" | "renewal" | "termination"
  description: string
  user: string
}

interface LeaseTimelineProps {
  timeline: TimelineEvent[]
}

const eventConfig = {
  created: { icon: FileText, color: "bg-blue-100 text-blue-800", iconColor: "text-blue-600" },
  signed: { icon: PenTool, color: "bg-green-100 text-green-800", iconColor: "text-green-600" },
  payment: { icon: Euro, color: "bg-purple-100 text-purple-800", iconColor: "text-purple-600" },
  renewal: { icon: Calendar, color: "bg-orange-100 text-orange-800", iconColor: "text-orange-600" },
  termination: { icon: AlertCircle, color: "bg-red-100 text-red-800", iconColor: "text-red-600" },
}

const LeaseTimeline = ({ lease }: { lease: any }) => {
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
        isCompleted: lease.docusign_status === 'Completed',
        icon: <PenSquare className="h-4 w-4" />,
    },
    {
      title: 'Début du bail',
      date: lease.start_date,
      description: 'Le bail est officiellement entré en vigueur.',
      isCompleted: new Date(lease.start_date) <= new Date(),
      icon: <Calendar className="h-4 w-4" />,
    },
  ];

export function LeaseTimeline({ timeline }: LeaseTimelineProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Historique du bail</h3>
      <div className="relative">
        <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
        {timelineEvents.filter(event => event.isCompleted || event.date).map((event, index) => (
          <div key={index} className="flex items-start mb-6">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center z-10 ${event.isCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}>
              {event.isCompleted ? <CheckCircle className="h-4 w-4" /> : event.icon}
            </div>
            <div className="ml-4">
              <h4 className="font-semibold">{event.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {event.date ? new Date(event.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'À venir'}
              </p>
              <p className="text-sm mt-1">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
