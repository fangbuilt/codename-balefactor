import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

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

interface AddOnModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (
    menuItemId: Id<"menuItems">,
    quantity: number,
    addOns: Id<"addOns">[],
    modifiers?: {
      temperature?: Id<"itemModifiers">;
      sweetness?: Id<"itemModifiers">;
    }
  ) => void;
}

export function AddOnModal({ item, onClose, onAddToCart }: AddOnModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<Id<"addOns">[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<{
    temperature?: Id<"itemModifiers">;
    sweetness?: Id<"itemModifiers">;
  }>({});
  
  const addOns = useQuery(api.addOns.list);
  const modifiers = useQuery(api.itemModifiers.list);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const availableAddOns = addOns?.filter(addOn => {
    if (item.addOnEligibility === "coffee-based") {
      return true; // Both extra-shot and oat-milk
    } else if (item.addOnEligibility === "non-coffee") {
      return addOn.type === "oat-milk"; // Only oat-milk
    } else if (item.addOnEligibility === "coffee-only") {
      return addOn.type === "extra-shot";
    }
    return false;
  }) || [];

  const temperatureOptions = (modifiers || []).filter(
    (modifier) =>
      modifier.type === "temperature" &&
      (item.itemModifierEligibility?.temperature || []).some(
        (allowedId) => allowedId === modifier._id
      )
  );

  const sweetnessOptions = (modifiers || []).filter(
    (modifier) =>
      modifier.type === "sweetness" &&
      (item.itemModifierEligibility?.sweetness || []).some(
        (allowedId) => allowedId === modifier._id
      )
  );

  const toggleAddOn = (addOnId: Id<"addOns">) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const toggleModifier = (
    type: "temperature" | "sweetness",
    modifierId: Id<"itemModifiers">
  ) => {
    setSelectedModifiers((prev) => {
      const current = prev[type];
      if (current === modifierId) {
        const next = { ...prev };
        delete next[type];
        return next;
      }
      return {
        ...prev,
        [type]: modifierId,
      };
    });
  };

  const calculateTotal = () => {
    const addOnTotal = selectedAddOns.reduce((sum, addOnId) => {
      const addOn = addOns?.find(a => a._id === addOnId);
      return sum + (addOn?.price || 0);
    }, 0);
    return (item.finalPrice + addOnTotal) * quantity;
  };

  const handleAddToCart = () => {
    onAddToCart(item._id, quantity, selectedAddOns, selectedModifiers);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
            <p className="text-gray-500">{formatPrice(item.finalPrice)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Quantity */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-semibold"
            >
              -
            </button>
            <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-semibold"
            >
              +
            </button>
          </div>
        </div>

        {/* Temperature Modifiers */}
        {temperatureOptions.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Temperature Preference
            </label>
            <div className="space-y-2">
              {temperatureOptions.map((modifier) => (
                <button
                  key={modifier._id}
                  onClick={() => toggleModifier("temperature", modifier._id)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedModifiers.temperature === modifier._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-medium">{modifier.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sweetness Modifiers */}
        {sweetnessOptions.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Sweetness Level
            </label>
            <div className="space-y-2">
              {sweetnessOptions.map((modifier) => (
                <button
                  key={modifier._id}
                  onClick={() => toggleModifier("sweetness", modifier._id)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedModifiers.sweetness === modifier._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-medium">{modifier.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add-ons */}
        {availableAddOns.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Add-ons
            </label>
            <div className="space-y-2">
              {availableAddOns.map((addOn) => (
                <button
                  key={addOn._id}
                  onClick={() => toggleAddOn(addOn._id)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedAddOns.includes(addOn._id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{addOn.name}</span>
                    <span className="text-gray-600">{formatPrice(addOn.price)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Total and Add to Cart */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-xl font-bold text-blue-600">
              {formatPrice(calculateTotal())}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
