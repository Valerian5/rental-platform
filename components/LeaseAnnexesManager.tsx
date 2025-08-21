"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

interface LeaseAnnexesManagerProps {
  leaseId: string
}

interface Annex {
  name: string
  url: string
}

export default function LeaseAnnexesManager({ leaseId }: LeaseAnnexesManagerProps) {
  const [annexes, setAnnexes] = useState<Annex[]>([])
  const [loading, setLoading] = useState(false)

  // Charger annexes existantes
  useEffect(() => {
    loadAnnexes()
  }, [leaseId])

  async function loadAnnexes() {
    setLoading(true)
    const { data, error } = await supabase.storage
      .from("lease-annexes")
      .list(leaseId + "/", { limit: 50, offset: 0 })

    if (error) {
      console.error("❌ Erreur list annexes:", error)
      setLoading(false)
      return
    }

    const files: Annex[] = await Promise.all(
      data.map(async (f) => {
        const { data: signedUrl } = await supabase.storage
          .from("lease-annexes")
          .createSignedUrl(`${leaseId}/${f.name}`, 60 * 60) // 1h
        return { name: f.name, url: signedUrl?.signedUrl || "" }
      })
    )

    setAnnexes(files)
    setLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const filePath = `${leaseId}/${file.name}`

    const { error } = await supabase.storage
      .from("lease-annexes")
      .upload(filePath, file, { upsert: true })

    if (error) {
      console.error("❌ Erreur upload:", error)
      setLoading(false)
      return
    }

    await loadAnnexes()
  }

  async function handleDelete(name: string) {
    const { error } = await supabase.storage
      .from("lease-annexes")
      .remove([`${leaseId}/${name}`])

    if (error) {
      console.error("❌ Erreur suppression:", error)
      return
    }

    setAnnexes((prev) => prev.filter((a) => a.name !== name))
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📂 Annexes du bail</h3>

      <input type="file" onChange={handleUpload} />

      {loading && <p>Chargement...</p>}

      <ul className="space-y-2">
        {annexes.map((a) => (
          <li key={a.name} className="flex items-center justify-between border rounded p-2">
            <a href={a.url} target="_blank" className="text-blue-600 underline">
              {a.name}
            </a>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(a.name)}>
              Supprimer
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
