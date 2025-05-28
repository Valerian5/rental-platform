import { createServerClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { checkSession } from "@/lib/session"

async function getRevisionData() {
  const session = await checkSession()

  if (!session) {
    redirect("/auth/signin")
  }

  const supabase = createServerClient()

  const { data: revisions, error } = await supabase.from("revisions").select("*")

  if (error) {
    console.error("Error fetching revisions:", error)
    return []
  }

  return revisions
}

export default async function RevisionPage() {
  const revisions = await getRevisionData()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">Revisions</h1>
      {revisions.length > 0 ? (
        <table className="table-auto w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Rental ID</th>
              <th className="px-4 py-2">Created At</th>
              <th className="px-4 py-2">Updated At</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {revisions.map((revision) => (
              <tr key={revision.id}>
                <td className="border px-4 py-2">{revision.id}</td>
                <td className="border px-4 py-2">{revision.rental_id}</td>
                <td className="border px-4 py-2">{revision.created_at}</td>
                <td className="border px-4 py-2">{revision.updated_at}</td>
                <td className="border px-4 py-2">{revision.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No revisions found.</p>
      )}
    </div>
  )
}
