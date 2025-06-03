"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { openDocument, convertBlobUrlToApiUrl, getDocumentDisplayName } from "@/lib/document-utils"

interface Document {
  url: string
  file_name: string
}

interface RentalFiles {
  identity_documents: Document[]
  lease_agreement: Document[]
  proof_of_insurance: Document[]
  other_documents: Document[]
}

const RentalFilesView = () => {
  const { id } = useParams()
  const [rentalFiles, setRentalFiles] = useState<RentalFiles | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRentalFiles = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/rental-files/${id}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setRentalFiles(data)
      } catch (error: any) {
        console.error("Failed to fetch rental files:", error)
        toast({
          variant: "destructive",
          title: "Error fetching rental files",
          description: error.message,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRentalFiles()
  }, [id, toast])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
        <Skeleton className="h-4 w-[300px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
    )
  }

  if (!rentalFiles) {
    return <div>Failed to load rental files.</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">Rental Files - {id}</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Identity Documents</h2>
        {rentalFiles.identity_documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rentalFiles.identity_documents.map((doc, index) => (
              <div key={index} className="border rounded-lg p-4">
                <img
                  src={convertBlobUrlToApiUrl(doc.url) || "/placeholder.svg"}
                  alt={getDocumentDisplayName(doc.file_name, "identity_documents")}
                  className="w-full h-32 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=128&width=200"
                  }}
                />
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-sm">{getDocumentDisplayName(doc.file_name, "identity_documents")}</p>
                  <Button size="sm" onClick={() => openDocument(doc.url)}>
                    View Document
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No identity documents found.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Lease Agreement</h2>
        {rentalFiles.lease_agreement.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rentalFiles.lease_agreement.map((doc, index) => (
              <div key={index} className="border rounded-lg p-4">
                <img
                  src={convertBlobUrlToApiUrl(doc.url) || "/placeholder.svg"}
                  alt={getDocumentDisplayName(doc.file_name, "lease_agreement")}
                  className="w-full h-32 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=128&width=200"
                  }}
                />
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-sm">{getDocumentDisplayName(doc.file_name, "lease_agreement")}</p>
                  <Button size="sm" onClick={() => openDocument(doc.url)}>
                    View Document
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No lease agreements found.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Proof of Insurance</h2>
        {rentalFiles.proof_of_insurance.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rentalFiles.proof_of_insurance.map((doc, index) => (
              <div key={index} className="border rounded-lg p-4">
                <img
                  src={convertBlobUrlToApiUrl(doc.url) || "/placeholder.svg"}
                  alt={getDocumentDisplayName(doc.file_name, "proof_of_insurance")}
                  className="w-full h-32 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=128&width=200"
                  }}
                />
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-sm">{getDocumentDisplayName(doc.file_name, "proof_of_insurance")}</p>
                  <Button size="sm" onClick={() => openDocument(doc.url)}>
                    View Document
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No proof of insurance documents found.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Other Documents</h2>
        {rentalFiles.other_documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rentalFiles.other_documents.map((doc, index) => (
              <div key={index} className="border rounded-lg p-4">
                <img
                  src={convertBlobUrlToApiUrl(doc.url) || "/placeholder.svg"}
                  alt={getDocumentDisplayName(doc.file_name, "other_documents")}
                  className="w-full h-32 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=128&width=200"
                  }}
                />
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-sm">{getDocumentDisplayName(doc.file_name, "other_documents")}</p>
                  <Button size="sm" onClick={() => openDocument(doc.url)}>
                    View Document
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No other documents found.</p>
        )}
      </section>
    </div>
  )
}

export default RentalFilesView
