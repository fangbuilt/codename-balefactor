import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface BulkActionModalProps {
  selectedItems: Id<"menuItems">[];
  onClose: () => void;
  onComplete: () => void;
}

export function BulkActionModal({ selectedItems, onClose, onComplete }: BulkActionModalProps) {
  const [action, setAction] = useState<"status" | "promo" | "delete">("status");
  const [statusValue, setStatusValue] = useState<"active" | "inactive">("active");
  const [promoForm, setPromoForm] = useState({
    hasPromo: true,
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    promoStartDate: "",
    promoEndDate: "",
    promoActive: true,
  });

  const bulkUpdate = useMutation(api.menuItems.bulkUpdate);
  const bulkDelete = useMutation(api.menuItems.bulkDelete);

  const handleSubmit = () => {
    if (action === "delete") {
      bulkDelete({ ids: selectedItems }).then(() => {
        toast.success(`${selectedItems.length} items deleted`);
        onComplete();
      }).catch((error) => {
        toast.error("Failed to delete items");
        console.error(error);
      });
      return;
    }

    if (action === "status") {
      bulkUpdate({
        ids: selectedItems,
        updates: { status: statusValue },
      }).then(() => {
        toast.success(`${selectedItems.length} items updated`);
        onComplete();
      }).catch((error) => {
        toast.error("Failed to update items");
        console.error(error);
      });
      return;
    }

    if (action === "promo") {
      const discountValue = parseFloat(promoForm.discountValue);
      if (isNaN(discountValue) || discountValue <= 0) {
        toast.error("Please enter a valid discount value");
        return;
      }

      if (promoForm.discountType === "percentage" && discountValue > 100) {
        toast.error("Percentage discount cannot exceed 100%");
        return;
      }

      const updates: any = {
        hasPromo: promoForm.hasPromo,
      };

      if (promoForm.hasPromo) {
        updates.discountType = promoForm.discountType;
        updates.discountValue = discountValue;
        updates.promoStartDate = promoForm.promoStartDate ? new Date(promoForm.promoStartDate).getTime() : undefined;
        updates.promoEndDate = promoForm.promoEndDate ? new Date(promoForm.promoEndDate).getTime() : undefined;
        updates.promoActive = promoForm.promoActive;
      } else {
        updates.discountType = undefined;
        updates.discountValue = undefined;
        updates.promoStartDate = undefined;
        updates.promoEndDate = undefined;
        updates.promoActive = false;
      }

      bulkUpdate({
        ids: selectedItems,
        updates,
      }).then(() => {
        toast.success(`${selectedItems.length} items updated`);
        onComplete();
      }).catch((error) => {
        toast.error("Failed to update items");
        console.error(error);
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Bulk Actions</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Apply action to {selectedItems.length} selected item{selectedItems.length > 1 ? 's' : ''}
        </p>

        {/* Action Selection */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Action
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="status"
                  checked={action === "status"}
                  onChange={(e) => setAction(e.target.value as any)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Update Status</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="promo"
                  checked={action === "promo"}
                  onChange={(e) => setAction(e.target.value as any)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Update Promo/Discount</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="delete"
                  checked={action === "delete"}
                  onChange={(e) => setAction(e.target.value as any)}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="text-red-600">Delete Items</span>
              </label>
            </div>
          </div>

          {/* Status Options */}
          {action === "status" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}

          {/* Promo Options */}
          {action === "promo" && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={promoForm.hasPromo}
                    onChange={(e) => setPromoForm({ ...promoForm, hasPromo: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Promo/Discount</span>
                </label>
              </div>

              {promoForm.hasPromo && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Type
                    </label>
                    <select
                      value={promoForm.discountType}
                      onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (IDR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      value={promoForm.discountValue}
                      onChange={(e) => setPromoForm({ ...promoForm, discountValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={promoForm.discountType === "percentage" ? "Enter percentage (e.g., 20)" : "Enter amount in IDR"}
                      min="0"
                      max={promoForm.discountType === "percentage" ? "100" : undefined}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={promoForm.promoStartDate}
                      onChange={(e) => setPromoForm({ ...promoForm, promoStartDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={promoForm.promoEndDate}
                      onChange={(e) => setPromoForm({ ...promoForm, promoEndDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={promoForm.promoActive}
                        onChange={(e) => setPromoForm({ ...promoForm, promoActive: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Promo Active</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delete Confirmation */}
          {action === "delete" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                ⚠️ This action cannot be undone. All selected items will be permanently deleted.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
              action === "delete"
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {action === "delete" ? "Delete Items" : "Apply Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
