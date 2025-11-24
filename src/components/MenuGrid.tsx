import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { AddOnModal } from "./AddOnModal";
import { useState } from "react";
import { toast } from "sonner";

interface MenuItem {
  _id: Id<"menuItems">;
  name: string;
  category: string;
  cogm: number;
  finalPrice: number;
  hasActivePromo: boolean;
  addOnEligibility: "coffee-based" | "non-coffee" | "none" | "coffee-only";
  itemModifierEligibility?: {
    temperature?: Id<"itemModifiers">[];
    sweetness?: Id<"itemModifiers">[];
  };
}

interface MenuGridProps {
  items: MenuItem[];
}

export function MenuGrid({ items }: MenuGridProps) {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const addToCart = useMutation(api.transactions.addToCart);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const hasModifierEligibility = (item: MenuItem) => {
    const temperatureCount = item.itemModifierEligibility?.temperature?.length || 0;
    const sweetnessCount = item.itemModifierEligibility?.sweetness?.length || 0;
    return temperatureCount > 0 || sweetnessCount > 0;
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.addOnEligibility !== "none" || hasModifierEligibility(item)) {
      setSelectedItem(item);
      return;
    }

    addToCart({
      menuItemId: item._id,
      quantity: 1,
      addOns: [],
    })
      .then(() => {
        toast.success(`${item.name} added to cart`);
      })
      .catch((error) => {
        toast.error("Failed to add item to cart");
        console.error(error);
      });
  };

  const handleAddToCart = (
    menuItemId: Id<"menuItems">,
    quantity: number,
    addOns: Id<"addOns">[],
    modifiers?: { temperature?: Id<"itemModifiers">; sweetness?: Id<"itemModifiers"> }
  ) => {
    addToCart({
      menuItemId,
      quantity,
      addOns,
      modifiers,
    })
      .then(() => {
        const item = items.find((i) => i._id === menuItemId);
        toast.success(`${item?.name} added to cart`);
        setSelectedItem(null);
      })
      .catch((error) => {
        toast.error("Failed to add item to cart");
        console.error(error);
      });
  };

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">🍽️</div>
          <p>No menu items found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 p-4">
        {items.map((item) => (
          <button
            key={item._id}
            onClick={() => handleItemClick(item)}
            className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow text-left"
          >
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                {item.name}
              </h3>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {item.category}
              </p>
              <div className="flex flex-col space-y-1">
                {item.hasActivePromo && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(item.cogm)}
                  </span>
                )}
                <span className={`font-bold ${item.hasActivePromo ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatPrice(item.finalPrice)}
                </span>
                {item.hasActivePromo && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full inline-block w-fit">
                    PROMO
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedItem && (
        <AddOnModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  );
}
