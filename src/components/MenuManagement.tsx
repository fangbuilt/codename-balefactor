import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { EditItemModal } from "./EditItemModal";
import { BulkActionModal } from "./BulkActionModal";
import { Id } from "../../convex/_generated/dataModel";

interface MenuManagementProps {
  onAddItem: () => void;
}

export function MenuManagement({ onAddItem }: MenuManagementProps) {
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Id<"menuItems"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedItems, setSelectedItems] = useState<Set<Id<"menuItems">>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  const menuItems = useQuery(api.menuItems.list);
  const removeItem = useMutation(api.menuItems.remove);
  const bulkDelete = useMutation(api.menuItems.bulkDelete);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleDelete = (itemId: Id<"menuItems">) => {
    removeItem({ id: itemId }).then(() => {
      toast.success("Menu item deleted");
      setShowDeleteConfirm(null);
    }).catch((error) => {
      toast.error("Failed to delete item");
      console.error(error);
    });
  };

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;
    
    bulkDelete({ ids: Array.from(selectedItems) }).then(() => {
      toast.success(`${selectedItems.size} items deleted`);
      setSelectedItems(new Set());
    }).catch((error) => {
      toast.error("Failed to delete items");
      console.error(error);
    });
  };

  const toggleItemSelection = (itemId: Id<"menuItems">) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item._id)));
    }
  };

  const categories = ["All", "Coffee", "Non-Coffee", "Merch", "Promo", "Add-on", "Consignment", "Bundle"];
  const statusOptions = ["All", "Active", "Inactive"];

  const filteredItems = menuItems?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const itemStatus = item.status || "active";
    const matchesStatus = statusFilter === "All" || 
      (statusFilter === "Active" && itemStatus === "active") ||
      (statusFilter === "Inactive" && itemStatus === "inactive");
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
        <button
          onClick={onAddItem}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          + Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border space-y-4">
        {/* Search Bar */}
        <div>
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Category and Status Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="flex gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-blue-800 font-medium">
              {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowBulkModal(true)}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-600"
              >
                Bulk Actions
              </button>
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-600"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-gray-600"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select All */}
      {filteredItems.length > 0 && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
            onChange={toggleSelectAll}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">
            Select All ({filteredItems.length} items)
          </label>
        </div>
      )}

      {/* Menu Items List */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <div key={item._id} className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={selectedItems.has(item._id)}
                onChange={() => toggleItemSelection(item._id)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  {item.hasActivePromo && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      PROMO
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    (item.status || "active") === "active" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {(item.status || "active").toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                <div className="flex flex-col space-y-1 text-sm text-gray-700">
                  <div className="flex items-center space-x-4">
                    <span>COGM: {formatPrice(item.cogm)}</span>
                    {item.hasActivePromo && (
                      <span className="text-red-600">
                        Sale: {formatPrice(item.finalPrice)}
                      </span>
                    )}
                    <span className="text-gray-500">
                      Add-ons: {item.addOnEligibility}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-gray-500">
                    <span>
                      Temperature Mods: {item.itemModifierEligibility?.temperature?.length || 0}
                    </span>
                    <span>
                      Sweetness Mods: {item.itemModifierEligibility?.sweetness?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingItem(item)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(item._id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p>No menu items found matching your filters</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <BulkActionModal
          selectedItems={Array.from(selectedItems)}
          onClose={() => setShowBulkModal(false)}
          onComplete={() => {
            setSelectedItems(new Set());
            setShowBulkModal(false);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Delete Item?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this menu item? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
