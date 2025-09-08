// components/GuarantorSelector.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

// Définir un type pour la structure des données du garant
interface Guarantor {
  type: string;
  personal_info: {
    last_name: string;
    first_name: string;
    // Ajoutez ici d'autres champs que vous souhaitez utiliser
  };
}

interface GuarantorSelectorProps {
  guarantors: Guarantor[];
  onAddGuarantor: (guarantor: Guarantor) => void;
}

const GuarantorSelector: React.FC<GuarantorSelectorProps> = ({ guarantors, onAddGuarantor }) => {
  if (!guarantors || guarantors.length === 0) {
    return null; // Ne rien afficher si aucun garant n'est disponible
  }

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>{guarantors.length} Garant(s) disponible(s)</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Ajoutez les garants de ce dossier pour pré-remplir les informations de l'acte de cautionnement.
        </p>
        <div className="space-y-4">
          {guarantors.map((guarantor, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div>
                <p className="font-semibold">{guarantor.personal_info.first_name} {guarantor.personal_info.last_name}</p>
                <p className="text-sm text-gray-500">{guarantor.type === 'physical' ? 'Personne physique' : 'Autre'}</p>
              </div>
              <Button onClick={() => onAddGuarantor(guarantor)} size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GuarantorSelector;