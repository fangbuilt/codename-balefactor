import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function Cart() {
  const [isOpen, setIsOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountForm, setDiscountForm] = useState({
    type: "percentage" as "percentage" | "fixed",
    value: "",
  });
  
  const cart = useQuery(api.transactions.getCurrentCart);
  const updateQuantity = useMutation(api.transactions.updateCartItemQuantity);
  const clearCart = useMutation(api.transactions.clearCart);
  const checkout = useMutation(api.transactions.checkout);
  const applyTransactionDiscount = useMutation(api.transactions.applyTransactionDiscount);
  const removeTransactionDiscount = useMutation(api.transactions.removeTransactionDiscount);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const openCartSheet = () => setIsOpen(true);
  const closeCartSheet = () => setIsOpen(false);

  const handleQuantityChange = (itemIndex: number, newQuantity: number) => {
    updateQuantity({ itemIndex, quantity: newQuantity }).catch((error) => {
      toast.error("Failed to update quantity");
      console.error(error);
    });
  };

  const handleClearCart = () => {
    clearCart().then(() => {
      toast.success("Cart cleared");
      setShowClearConfirm(false);
      setIsOpen(false);
    }).catch((error) => {
      toast.error("Failed to clear cart");
      console.error(error);
    });
  };

  const handleCheckout = () => {
    checkout().then(() => {
      toast.success("Order completed successfully!");
      setShowCheckoutConfirm(false);
      setIsOpen(false);
    }).catch((error) => {
      toast.error("Failed to complete order");
      console.error(error);
    });
  };

  const handleApplyDiscount = () => {
    const value = parseFloat(discountForm.value);
    if (isNaN(value) || value <= 0) {
      toast.error("Please enter a valid discount value");
      return;
    }

    if (discountForm.type === "percentage" && value > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }

    applyTransactionDiscount({
      type: discountForm.type,
      value,
    }).then(() => {
      toast.success("Transaction discount applied");
      setShowDiscountModal(false);
      setDiscountForm({ type: "percentage", value: "" });
      openCartSheet();
    }).catch((error) => {
      toast.error("Failed to apply discount");
      console.error(error);
    });
  };

  const handleRemoveDiscount = () => {
    removeTransactionDiscount().then(() => {
      toast.success("Transaction discount removed");
    }).catch((error) => {
      toast.error("Failed to remove discount");
      console.error(error);
    });
  };

  if (!cart || cart.items.length === 0) {
    return null;
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const itemDiscount = cart.items.reduce((sum, item) => sum + ((item.appliedDiscount?.amount || 0) * item.quantity), 0);

  return (
    <>
      {/* Cart Button */}
      <div className="fixed bottom-4 left-4 right-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-blue-500 text-white py-4 rounded-lg font-semibold shadow-lg flex justify-between items-center px-6"
        >
          <span>Cart ({itemCount} items)</span>
          <span>{formatPrice(cart.total)}</span>
        </button>
      </div>

      {/* Cart Bottom Sheet */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Your Order</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.items.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{item.menuItem?.name}</h3>
                    <button
                      onClick={() => handleQuantityChange(index, 0)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  {/* Add-ons */}
                  {item.addOns.length > 0 && (
                    <div className="text-sm text-gray-600 mb-2">
                      Add-ons: {item.addOns.map(addOn => addOn.details?.name).join(", ")}
                    </div>
                  )}

                  {/* Modifiers */}
                  {(item.modifierDetails?.temperature || item.modifierDetails?.sweetness) && (
                    <div className="text-sm text-gray-600 mb-2">
                      Preferences: {[
                        item.modifierDetails?.temperature?.name,
                        item.modifierDetails?.sweetness?.name,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                  )}

                  {/* Discount */}
                  {item.appliedDiscount && (
                    <div className="text-sm text-red-600 mb-2">
                      Item Discount: -{formatPrice(item.appliedDiscount.amount * item.quantity)}
                    </div>
                  )}

                  {/* Quantity and Price */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange(index, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold"
                      >
                        -
                      </button>
                      <span className="font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(index, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-bold">{formatPrice(item.itemTotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t p-6 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              
              {itemDiscount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Item Discounts:</span>
                  <span>-{formatPrice(itemDiscount)}</span>
                </div>
              )}

              {cart.transactionDiscount && (
                <div className="flex justify-between items-center text-red-600">
                  <span>Transaction Discount:</span>
                  <div className="flex items-center space-x-2">
                    <span>-{formatPrice(cart.transactionDiscount.amount)}</span>
                    <button
                      onClick={handleRemoveDiscount}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-xl font-bold border-t pt-3">
                <span>Total:</span>
                <span>{formatPrice(cart.total)}</span>
              </div>

              {/* Transaction Discount Button */}
              {!cart.transactionDiscount && (
                <button
                  onClick={() => {
                    closeCartSheet();
                    setShowDiscountModal(true);
                  }}
                  className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                >
                  Apply Transaction Discount
                </button>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-3">
                <button
                  onClick={() => {
                    closeCartSheet();
                    setShowClearConfirm(true);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Clear Cart
                </button>
                <button
                  onClick={() => {
                    closeCartSheet();
                    setShowCheckoutConfirm(true);
                  }}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Apply Transaction Discount</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type
                </label>
                <select
                  value={discountForm.type}
                  onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value as "percentage" | "fixed" })}
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
                  value={discountForm.value}
                  onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={discountForm.type === "percentage" ? "Enter percentage (e.g., 10)" : "Enter amount in IDR"}
                  min="0"
                  max={discountForm.type === "percentage" ? "100" : undefined}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDiscountModal(false);
                  openCartSheet();
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyDiscount}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Cart Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Clear Cart?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove all items from your cart?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  openCartSheet();
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCart}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Confirmation */}
      {showCheckoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Complete Order?</h3>
            <p className="text-gray-600 mb-2">
              Total: <span className="font-bold">{formatPrice(cart.total)}</span>
            </p>
            <p className="text-gray-600 mb-6">
              Confirm to complete this order.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCheckoutConfirm(false);
                  openCartSheet();
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
