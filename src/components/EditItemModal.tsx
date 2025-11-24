import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface EditItemModalProps {
  item: any;
  onClose: () => void;
}

export function EditItemModal({ item, onClose }: EditItemModalProps) {
  const [formData, setFormData] = useState({
    name: item.name,
    category: item.category,
    cogm: item.cogm.toString(),
    addOnEligibility: item.addOnEligibility,
    status: (item.status || "active") as "active" | "inactive",
    hasPromo: item.hasPromo || false,
    discountType: item.discountType || "percentage",
    discountValue: item.discountValue?.toString() || "",
    promoStartDate: item.promoStartDate ? new Date(item.promoStartDate).toISOString().slice(0, 16) : "",
    promoEndDate: item.promoEndDate ? new Date(item.promoEndDate).toISOString().slice(0, 16) : "",
    promoActive: item.promoActive || false,
    temperatureModifiers: (item.itemModifierEligibility?.temperature || []) as Id<"itemModifiers">[],
    sweetnessModifiers: (item.itemModifierEligibility?.sweetness || []) as Id<"itemModifiers">[],
  });

  const updateItem = useMutation(api.menuItems.update);
  const itemModifiers = useQuery(api.itemModifiers.list);

  const categories = ["Coffee", "Non-Coffee", "Merch", "Promo", "Add-on", "Consignment", "Bundle"];
  const addOnOptions = [
    { value: "coffee-only", label: "Coffee-only (Extra Shot only)" },
    { value: "coffee-based", label: "Coffee-based (Extra Shot + Oat Milk)" },
    { value: "non-coffee", label: "Non-coffee (Oat Milk only)" },
    { value: "none", label: "No add-ons" },
  ];

  const temperatureOptions = (itemModifiers || []).filter(
    (modifier) => modifier.type === "temperature"
  );
  const sweetnessOptions = (itemModifiers || []).filter(
    (modifier) => modifier.type === "sweetness"
  );

  const toggleModifierSelection = (
    type: "temperature" | "sweetness",
    modifierId: Id<"itemModifiers">
  ) => {
    if (type === "temperature") {
      const exists = formData.temperatureModifiers.includes(modifierId);
      const updated = exists
        ? formData.temperatureModifiers.filter((id) => id !== modifierId)
        : [...formData.temperatureModifiers, modifierId];
      setFormData({
        ...formData,
        temperatureModifiers: updated,
      });
      return;
    }

    const exists = formData.sweetnessModifiers.includes(modifierId);
    const updated = exists
      ? formData.sweetnessModifiers.filter((id) => id !== modifierId)
      : [...formData.sweetnessModifiers, modifierId];
    setFormData({
      ...formData,
      sweetnessModifiers: updated,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.cogm) {
      toast.error("Please fill in all required fields");
      return;
    }

    const cogmValue = parseFloat(formData.cogm);
    if (isNaN(cogmValue) || cogmValue <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    let discountValue = undefined;
    if (formData.hasPromo && formData.discountValue) {
      discountValue = parseFloat(formData.discountValue);
      if (isNaN(discountValue) || discountValue <= 0) {
        toast.error("Please enter a valid discount value");
        return;
      }
    }

    const updates: any = {
      id: item._id,
      name: formData.name.trim(),
      category: formData.category,
      cogm: cogmValue,
      addOnEligibility: formData.addOnEligibility,
      status: formData.status,
      hasPromo: formData.hasPromo,
      itemModifierEligibility: {
        temperature: formData.temperatureModifiers,
        sweetness: formData.sweetnessModifiers,
      },
    };

    if (formData.hasPromo) {
      updates.discountType = formData.discountType;
      updates.discountValue = discountValue;
      updates.promoStartDate = formData.promoStartDate ? new Date(formData.promoStartDate).getTime() : undefined;
      updates.promoEndDate = formData.promoEndDate ? new Date(formData.promoEndDate).getTime() : undefined;
      updates.promoActive = formData.promoActive;
    } else {
      updates.discountType = undefined;
      updates.discountValue = undefined;
      updates.promoStartDate = undefined;
      updates.promoEndDate = undefined;
      updates.promoActive = false;
    }

    updateItem(updates).then(() => {
      toast.success("Menu item updated successfully");
      onClose();
    }).catch((error) => {
      toast.error("Failed to update menu item");
      console.error(error);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Edit Menu Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* COGM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              COGM (Price in IDR) *
            </label>
            <input
              type="number"
              value={formData.cogm}
              onChange={(e) => setFormData({ ...formData, cogm: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="1000"
              required
            />
          </div>

          {/* Add-on Eligibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add-on Eligibility
            </label>
            <select
              value={formData.addOnEligibility}
              onChange={(e) => setFormData({ ...formData, addOnEligibility: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {addOnOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Temperature Modifiers */}
          {temperatureOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature Modifiers
              </label>
              <div className="flex flex-wrap gap-2">
                {temperatureOptions.map((modifier) => (
                  <button
                    key={modifier._id}
                    type="button"
                    onClick={() => toggleModifierSelection("temperature", modifier._id)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      formData.temperatureModifiers.includes(modifier._id)
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {modifier.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sweetness Modifiers */}
          {sweetnessOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sweetness Modifiers
              </label>
              <div className="flex flex-wrap gap-2">
                {sweetnessOptions.map((modifier) => (
                  <button
                    key={modifier._id}
                    type="button"
                    onClick={() => toggleModifierSelection("sweetness", modifier._id)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      formData.sweetnessModifiers.includes(modifier._id)
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-700 hover-border-gray-300"
                    }`}
                  >
                    {modifier.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Promo Toggle */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.hasPromo}
                onChange={(e) => setFormData({ ...formData, hasPromo: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Promo/Discount</span>
            </label>
          </div>

          {/* Promo Fields */}
          {formData.hasPromo && (
            <div className="space-y-4 border-t pt-4">
              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (IDR)</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value
                </label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={formData.discountType === "percentage" ? "Enter percentage (e.g., 20)" : "Enter amount in IDR"}
                  min="0"
                  max={formData.discountType === "percentage" ? "100" : undefined}
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.promoStartDate}
                  onChange={(e) => setFormData({ ...formData, promoStartDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.promoEndDate}
                  onChange={(e) => setFormData({ ...formData, promoEndDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Active Toggle */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.promoActive}
                    onChange={(e) => setFormData({ ...formData, promoActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Promo Active</span>
                </label>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Update Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
