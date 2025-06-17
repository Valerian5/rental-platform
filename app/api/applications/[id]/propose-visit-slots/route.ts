import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const applicationId = params.id
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const { data } = await request.json()

    if (!data || !Array.isArray(data) || data.length === 0) {
      return new NextResponse(JSON.stringify({ message: "No visit slots provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { error } = await supabase.from("visit_slots").insert(
      data.map((slot: any) => ({
        application_id: applicationId,
        start_time: slot.start_time,
        end_time: slot.end_time,
      })),
    )

    if (error) {
      console.error("Error inserting visit slots:", error)
      return new NextResponse(JSON.stringify({ message: "Failed to insert visit slots" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: "visit_proposed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (updateError) {
      console.error("Error updating application status:", updateError)
      return new NextResponse(JSON.stringify({ message: "Failed to update application status" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new NextResponse(JSON.stringify({ message: "Visit slots proposed successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (e) {
    console.error("Unexpected error:", e)
    return new NextResponse(JSON.stringify({ message: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
