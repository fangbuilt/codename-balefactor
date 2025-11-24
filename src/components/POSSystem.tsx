import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MenuGrid } from "./MenuGrid";
import { Cart } from "./Cart";
import { Analytics } from "./Analytics";
import { MenuManagement } from "./MenuManagement";
import { AddItemModal } from "./AddItemModal";
import { Doc } from "../../convex/_generated/dataModel";

type Tab = "menu" | "analytics" | "manage";

type UserWithRole = (Doc<"users"> & { role?: "admin" | "staff" }) | null;

interface POSSystemProps {
  currentUser: UserWithRole;
}

export function POSSystem({ currentUser }: POSSystemProps) {
  const [activeTab, setActiveTab] = useState<Tab>("menu");
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const isAdmin = currentUser?.role === "admin";
  
  const menuItems = useQuery(api.menuItems.listForPOS);
  const cart = useQuery(api.transactions.getCurrentCart);
  const initializeAddOns = useMutation(api.addOns.initializeAddOns);
  const initializeModifiers = useMutation(api.itemModifiers.initializeDefaults);

  useEffect(() => {
    // Initialize add-ons on first load
    const init = async () => {
      try {
        await initializeAddOns();
      } catch {
        // Ignore error if already initialized
      }

      try {
        await initializeModifiers();
      } catch {
        // Ignore error if already initialized
      }
    };

    void init();
  }, [initializeAddOns, initializeModifiers]);

  useEffect(() => {
    if (!isAdmin && activeTab === "manage") {
      setActiveTab("menu");
    }
  }, [isAdmin, activeTab]);

  // Remove "Add-on" from categories and add dynamic "Promo" items
  const categories = ["All", "Coffee", "Non-Coffee", "Merch", "Consignment", "Bundle"];
  
  // Add "Promo" category if there are items with active promos
  const hasPromoItems = menuItems?.some(item => item.hasActivePromo) || false;
  if (hasPromoItems && !categories.includes("Promo")) {
    categories.splice(4, 0, "Promo"); // Insert before "Consignment"
  }

  const filteredItems = menuItems?.filter(item => {
    if (selectedCategory === "All") return true;
    if (selectedCategory === "Promo") return item.hasActivePromo;
    return item.category === selectedCategory;
  }) || [];

  const tabs = [
    { id: "menu", label: "Menu", icon: "🍽️" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    ...(isAdmin ? [{ id: "manage", label: "Manage", icon: "⚙️" }] : []),
  ] as const;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "menu" && (
          <div className="flex flex-col h-full">
            {/* Category Filter */}
            <div className="bg-white border-b p-4">
              <div className="flex space-x-2 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
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

            {/* Menu Grid */}
            <div className="flex-1 overflow-y-auto">
              <MenuGrid items={filteredItems} />
            </div>
          </div>
        )}

        {activeTab === "analytics" && <Analytics />}

        {isAdmin && activeTab === "manage" && (
          <MenuManagement onAddItem={() => setShowAddItemModal(true)} />
        )}
      </div>

      {/* Cart (only show on menu tab) */}
      {activeTab === "menu" && cart && cart.items.length > 0 && <Cart />}

      {/* Add Item Modal */}
      {isAdmin && showAddItemModal && (
        <AddItemModal onClose={() => setShowAddItemModal(false)} />
      )}
    </div>
  );
}
