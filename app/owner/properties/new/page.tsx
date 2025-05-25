"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function NewPropertyPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    postalCode: "",
    surface: "",
    rentExcludingCharges: "",
    chargesAmount: "",
    propertyType: "",
    rentalType: "",
    constructionYear: "",
    securityDeposit: "",
    rooms: "",
    bedrooms: "",
    bathrooms: "",
    exteriorType: "",
    equipment: "",
    energyClass: "",
    gesClass: "",
    heatingType: "",
    requiredIncome: "",
    professionalSituation: "",
    guarantorRequired: false,
    leaseDuration: "",
    moveInDate: "",
    rentPaymentDay: "",
    hideExactAddress: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setFormData((prevData: any) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!session?.user) {
      setError("You must be logged in to create a property.")
      setLoading(false)
      return
    }

    const currentUser = session.user as { id: string; email: string }

    try {
      // Préparer les données pour l'API (seulement les colonnes qui existent)
      const propertyData = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode,
        surface: Number.parseInt(formData.surface),
        rent_excluding_charges: Number.parseInt(formData.rentExcludingCharges),
        charges_amount: Number.parseInt(formData.chargesAmount),
        property_type: formData.propertyType,
        rental_type: formData.rentalType,
        construction_year: Number.parseInt(formData.constructionYear),
        security_deposit: Number.parseInt(formData.securityDeposit),
        rooms: Number.parseInt(formData.rooms),
        bedrooms: Number.parseInt(formData.bedrooms),
        bathrooms: Number.parseInt(formData.bathrooms),
        exterior_type: formData.exteriorType,
        equipment: formData.equipment,
        energy_class: formData.energyClass,
        ges_class: formData.gesClass,
        heating_type: formData.heatingType,
        required_income: Number.parseInt(formData.requiredIncome),
        professional_situation: formData.professionalSituation,
        guarantor_required: formData.guarantorRequired,
        lease_duration: Number.parseInt(formData.leaseDuration),
        move_in_date: formData.moveInDate,
        rent_payment_day: Number.parseInt(formData.rentPaymentDay),
        hide_exact_address: formData.hideExactAddress,
        owner_id: currentUser.id,
      }

      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(propertyData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.message || "Failed to create property. Please check your inputs.")
        setLoading(false)
        return
      }

      router.push("/owner/properties")
      router.refresh()
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create a New Property</h1>
      {error && <div className="bg-red-200 text-red-800 p-2 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            rows={3}
          />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
            Postal Code
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="surface" className="block text-sm font-medium text-gray-700">
            Surface (m²)
          </label>
          <input
            type="number"
            id="surface"
            name="surface"
            value={formData.surface}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="rentExcludingCharges" className="block text-sm font-medium text-gray-700">
            Rent Excluding Charges (€)
          </label>
          <input
            type="number"
            id="rentExcludingCharges"
            name="rentExcludingCharges"
            value={formData.rentExcludingCharges}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="chargesAmount" className="block text-sm font-medium text-gray-700">
            Charges Amount (€)
          </label>
          <input
            type="number"
            id="chargesAmount"
            name="chargesAmount"
            value={formData.chargesAmount}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
            Property Type
          </label>
          <select
            id="propertyType"
            name="propertyType"
            value={formData.propertyType}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select Property Type</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="studio">Studio</option>
          </select>
        </div>
        <div>
          <label htmlFor="rentalType" className="block text-sm font-medium text-gray-700">
            Rental Type
          </label>
          <select
            id="rentalType"
            name="rentalType"
            value={formData.rentalType}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select Rental Type</option>
            <option value="furnished">Furnished</option>
            <option value="unfurnished">Unfurnished</option>
          </select>
        </div>
        <div>
          <label htmlFor="constructionYear" className="block text-sm font-medium text-gray-700">
            Construction Year
          </label>
          <input
            type="number"
            id="constructionYear"
            name="constructionYear"
            value={formData.constructionYear}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="securityDeposit" className="block text-sm font-medium text-gray-700">
            Security Deposit (€)
          </label>
          <input
            type="number"
            id="securityDeposit"
            name="securityDeposit"
            value={formData.securityDeposit}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="rooms" className="block text-sm font-medium text-gray-700">
            Rooms
          </label>
          <input
            type="number"
            id="rooms"
            name="rooms"
            value={formData.rooms}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">
            Bedrooms
          </label>
          <input
            type="number"
            id="bedrooms"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">
            Bathrooms
          </label>
          <input
            type="number"
            id="bathrooms"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="exteriorType" className="block text-sm font-medium text-gray-700">
            Exterior Type
          </label>
          <input
            type="text"
            id="exteriorType"
            name="exteriorType"
            value={formData.exteriorType}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="equipment" className="block text-sm font-medium text-gray-700">
            Equipment
          </label>
          <input
            type="text"
            id="equipment"
            name="equipment"
            value={formData.equipment}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="energyClass" className="block text-sm font-medium text-gray-700">
            Energy Class
          </label>
          <select
            id="energyClass"
            name="energyClass"
            value={formData.energyClass}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select Energy Class</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="F">F</option>
            <option value="G">G</option>
          </select>
        </div>
        <div>
          <label htmlFor="gesClass" className="block text-sm font-medium text-gray-700">
            GES Class
          </label>
          <select
            id="gesClass"
            name="gesClass"
            value={formData.gesClass}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select GES Class</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="F">F</option>
            <option value="G">G</option>
          </select>
        </div>
        <div>
          <label htmlFor="heatingType" className="block text-sm font-medium text-gray-700">
            Heating Type
          </label>
          <input
            type="text"
            id="heatingType"
            name="heatingType"
            value={formData.heatingType}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="requiredIncome" className="block text-sm font-medium text-gray-700">
            Required Income (€)
          </label>
          <input
            type="number"
            id="requiredIncome"
            name="requiredIncome"
            value={formData.requiredIncome}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="professionalSituation" className="block text-sm font-medium text-gray-700">
            Professional Situation
          </label>
          <input
            type="text"
            id="professionalSituation"
            name="professionalSituation"
            value={formData.professionalSituation}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="guarantorRequired"
            name="guarantorRequired"
            checked={formData.guarantorRequired}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="guarantorRequired" className="ml-2 block text-sm text-gray-900">
            Guarantor Required
          </label>
        </div>
        <div>
          <label htmlFor="leaseDuration" className="block text-sm font-medium text-gray-700">
            Lease Duration (months)
          </label>
          <input
            type="number"
            id="leaseDuration"
            name="leaseDuration"
            value={formData.leaseDuration}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="moveInDate" className="block text-sm font-medium text-gray-700">
            Move-in Date
          </label>
          <input
            type="date"
            id="moveInDate"
            name="moveInDate"
            value={formData.moveInDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="rentPaymentDay" className="block text-sm font-medium text-gray-700">
            Rent Payment Day
          </label>
          <input
            type="number"
            id="rentPaymentDay"
            name="rentPaymentDay"
            value={formData.rentPaymentDay}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="hideExactAddress"
            name="hideExactAddress"
            checked={formData.hideExactAddress}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="hideExactAddress" className="ml-2 block text-sm text-gray-900">
            Hide Exact Address
          </label>
        </div>

        <div>
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Property"}
          </button>
        </div>
      </form>
    </div>
  )
}
