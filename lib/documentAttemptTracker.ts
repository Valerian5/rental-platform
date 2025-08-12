interface DocumentAttempt {
  documentId: string
  attempts: number
  lastAttempt: string
  errors: string[]
}

class DocumentAttemptTracker {
  private attempts: Map<string, DocumentAttempt> = new Map()
  private readonly MAX_ATTEMPTS = 5

  getAttempts(documentId: string): number {
    return this.attempts.get(documentId)?.attempts || 0
  }

  canAttempt(documentId: string): boolean {
    return this.getAttempts(documentId) < this.MAX_ATTEMPTS
  }

  recordAttempt(documentId: string, error?: string): boolean {
    const current = this.attempts.get(documentId) || {
      documentId,
      attempts: 0,
      lastAttempt: new Date().toISOString(),
      errors: [],
    }

    current.attempts += 1
    current.lastAttempt = new Date().toISOString()

    if (error) {
      current.errors.push(error)
    }

    this.attempts.set(documentId, current)

    return current.attempts < this.MAX_ATTEMPTS
  }

  getProgressiveMessage(documentId: string): string {
    const attempts = this.getAttempts(documentId)

    if (attempts === 0) return ""

    if (attempts <= 2) {
      return "Vérifiez que le document correspond bien au mois demandé et qu'il est lisible."
    } else if (attempts <= 4) {
      return "Si vous continuez à avoir des problèmes, contactez le support technique."
    } else {
      return "⚠️ Dernier essai - Le document sera bloqué après cet échec."
    }
  }

  getRemainingAttempts(documentId: string): number {
    return Math.max(0, this.MAX_ATTEMPTS - this.getAttempts(documentId))
  }

  reset(documentId: string): void {
    this.attempts.delete(documentId)
  }

  getLastErrors(documentId: string): string[] {
    return this.attempts.get(documentId)?.errors || []
  }
}

export const documentAttemptTracker = new DocumentAttemptTracker()
