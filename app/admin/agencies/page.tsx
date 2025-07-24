"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { agencyApi } from "@/lib/api-client"

interface Agency {
  id: string
  name: string
  logo_url: string
  primary_color: string
  secondary_color: string
  accent_color: string
}

const AdminAgenciesPage = () => {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAgency, setNewAgency] = useState({
    name: "",
    logo_url: "",
    primary_color: "#0066FF",
    secondary_color: "#FF6B00",
    accent_color: "#00C48C",
  })
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchAgencies()
  }, [])

  const fetchAgencies = async () => {
    try {
      console.log("📋 Récupération des agences...")
      setLoading(true)

      const result = await agencyApi.getAll()
      console.log("📊 Résultat API:", result)

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch agencies")
      }

      setAgencies(result.agencies || [])
      console.log("✅ Agences chargées:", result.agencies?.length || 0)
    } catch (error) {
      console.error("❌ Error fetching agencies:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load agencies",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsCreating(true)

      if (!newAgency.name.trim()) {
        toast({
          title: "Error",
          description: "Agency name is required",
          variant: "destructive",
        })
        return
      }

      console.log("➕ Création d'une nouvelle agence:", newAgency)
      const result = await agencyApi.create(newAgency)

      if (!result.success) {
        throw new Error(result.error || "Failed to create agency")
      }

      toast({
        title: "Success",
        description: "Agency created successfully",
      })

      // Reset form and refresh list
      setNewAgency({
        name: "",
        logo_url: "",
        primary_color: "#0066FF",
        secondary_color: "#FF6B00",
        accent_color: "#00C48C",
      })
      setShowCreateForm(false)
      fetchAgencies()

      console.log("✅ Agence créée avec succès")
    } catch (error) {
      console.error("❌ Error creating agency:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create agency",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAgency({ ...newAgency, [e.target.name]: e.target.value })
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-5">Agencies</h1>

      <Button onClick={() => setShowCreateForm(!showCreateForm)}>
        {showCreateForm ? "Cancel" : "Create New Agency"}
      </Button>

      {showCreateForm && (
        <form onSubmit={handleCreateAgency} className="mt-5">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input type="text" id="name" name="name" value={newAgency.name} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input type="text" id="logo_url" name="logo_url" value={newAgency.logo_url} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="primary_color">Primary Color</Label>
              <Input
                type="color"
                id="primary_color"
                name="primary_color"
                value={newAgency.primary_color}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <Input
                type="color"
                id="secondary_color"
                name="secondary_color"
                value={newAgency.secondary_color}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="accent_color">Accent Color</Label>
              <Input
                type="color"
                id="accent_color"
                name="accent_color"
                value={newAgency.accent_color}
                onChange={handleChange}
              />
            </div>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Agency"}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading agencies...</p>
      ) : (
        <Table className="mt-10">
          <TableCaption>A list of your agencies.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Name</TableHead>
              <TableHead>Logo URL</TableHead>
              <TableHead>Primary Color</TableHead>
              <TableHead>Secondary Color</TableHead>
              <TableHead>Accent Color</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agencies.map((agency) => (
              <TableRow key={agency.id}>
                <TableCell className="font-medium">{agency.name}</TableCell>
                <TableCell>{agency.logo_url}</TableCell>
                <TableCell>{agency.primary_color}</TableCell>
                <TableCell>{agency.secondary_color}</TableCell>
                <TableCell>{agency.accent_color}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default AdminAgenciesPage
