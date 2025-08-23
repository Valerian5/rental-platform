import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle, AlertTriangle, Send } from 'lucide-react';

// Interface pour les détails de la signature
interface SignatureDetail {
  name: string;
  email: string;
  status: string;
  signedDate?: string;
  deliveredDate?: string;
}

// Props du composant DocusignStatus
interface DocusignStatusProps {
  status: string | null;
  signatures: SignatureDetail[] | null;
}

// Fonction pour obtenir l'icône correspondant au statut
const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'signed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'sent':
      return <Send className="h-5 w-5 text-blue-500" />;
    case 'delivered':
      return <Clock className="h-5 w-5 text-blue-500" />;
    case 'declined':
    case 'voided':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  }
};

// Fonction pour obtenir la couleur du badge en fonction du statut
const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
        case 'completed':
        case 'signed':
            return 'default';
        case 'sent':
        case 'delivered':
            return 'secondary';
        case 'declined':
        case 'voided':
            return 'destructive';
        default:
            return 'outline';
    }
}

/**
 * Composant pour afficher le statut de la signature Docusign et les détails pour chaque signataire.
 */
const DocusignStatus: React.FC<DocusignStatusProps> = ({ status, signatures }) => {
  if (!status) {
    return null;
  }

  const translatedStatus = (docusignStatus: string) => {
    const translations: { [key: string]: string } = {
      'sent': 'Envoyé',
      'delivered': 'Délivré',
      'signed': 'Signé',
      'completed': 'Complété',
      'declined': 'Refusé',
      'voided': 'Annulé',
    };
    return translations[docusignStatus.toLowerCase()] || docusignStatus;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <span className="mr-3">Signature Électronique</span>
          <Badge variant={getStatusColor(status)}>{translatedStatus(status)}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {signatures && signatures.map((signer, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
              <div className="flex items-center">
                {getStatusIcon(signer.status)}
                <div className="ml-4">
                  <p className="font-semibold">{signer.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{signer.email}</p>
                </div>
              </div>
              <div className="text-right">
                 <Badge variant={getStatusColor(signer.status)}>{translatedStatus(signer.status)}</Badge>
                 {signer.signedDate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Signé le {new Date(signer.signedDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                 )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocusignStatus;
