// Modèles de données pour la gestion des paiements

export interface Payment {
  id: string
  lease_id: string
  month: string // Format: "2025-03"
  year: number
  month_name: string // "Mars 2025"
  amount_due: number // Montant dû (loyer + charges)
  rent_amount: number
  charges_amount: number
  due_date: string // Date d'échéance (jour du mois)
  payment_date?: string // Date de paiement effectif
  status: PaymentStatus
  payment_method?: PaymentMethod
  reference: string // Référence unique
  receipt_id?: string // ID de la quittance générée
  created_at: string
  updated_at: string
}

export interface Receipt {
  id: string
  payment_id: string
  lease_id: string
  reference: string // Ex: "Quittance #2025-03-APT001"
  month: string
  year: number
  rent_amount: number
  charges_amount: number
  total_amount: number
  pdf_path?: string
  generated_at: string
  sent_to_tenant: boolean
  sent_at?: string
}

export interface Reminder {
  id: string
  payment_id: string
  lease_id: string
  tenant_id: string
  sent_at: string
  message: string
  status: 'sent' | 'delivered' | 'failed'
  reminder_type: 'first' | 'second' | 'final'
}

export interface LeasePaymentConfig {
  lease_id: string
  property_id: string
  tenant_id: string
  monthly_rent: number
  monthly_charges: number
  payment_day: number // Jour du mois (1-31)
  payment_method: PaymentMethod
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'
export type PaymentMethod = 'virement' | 'cheque' | 'especes' | 'prelevement'

export interface PaymentStats {
  total_received: number
  total_pending: number
  total_overdue: number
  collection_rate: number // Pourcentage de recouvrement
  average_delay: number // Délai moyen de paiement en jours
}

export interface PaymentHistory {
  payment: Payment
  receipt?: Receipt
  reminders: Reminder[]
}

// Configuration pour la génération des quittances
export interface ReceiptConfig {
  owner_name: string
  owner_address: string
  owner_phone?: string
  owner_email?: string
  legal_mention: string
  receipt_template: string
}

// Données d'entrée pour la validation d'un paiement
export interface PaymentValidationInput {
  payment_id: string
  status: 'paid' | 'unpaid'
  payment_date?: string
  payment_method?: PaymentMethod
  notes?: string
}

// Données de sortie après validation
export interface PaymentValidationOutput {
  payment: Payment
  receipt?: Receipt
  notification_sent: boolean
  history: PaymentHistory
}

// Données pour l'envoi d'un rappel
export interface ReminderInput {
  payment_id: string
  reminder_type: 'first' | 'second' | 'final'
  custom_message?: string
}

// Données de sortie pour un rappel
export interface ReminderOutput {
  reminder: Reminder
  email_sent: boolean
  notification_sent: boolean
}
