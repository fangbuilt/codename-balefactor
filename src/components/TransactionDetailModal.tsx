import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface TransactionDetailModalProps {
  transactionId: Id<"transactions">;
  onClose: () => void;
}

export function TransactionDetailModal({ transactionId, onClose }: TransactionDetailModalProps) {
  const transaction = useQuery(api.transactions.getTransactionById, { id: transactionId });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!transaction) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
        <div className="bg-white w-full rounded-t-2xl max-h-[80vh] flex flex-col">
          <div className="flex justify-center items-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  const itemDiscount = transaction.items.reduce((sum, item) => sum + ((item.appliedDiscount?.amount || 0) * item.quantity), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Transaction Details</h2>
            <p className="text-sm text-gray-500">{formatDate(transaction._creationTime)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Transaction Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {transaction.items.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{item.menuItem?.name}</h3>
                <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
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

              {/* Pricing breakdown */}
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Base price:</span>
                  <span>{formatPrice(item.basePrice * item.quantity)}</span>
                </div>
                {item.addOns.length > 0 && (
                  <div className="flex justify-between">
                    <span>Add-ons:</span>
                    <span>{formatPrice(item.addOns.reduce((sum, addOn) => sum + addOn.price, 0) * item.quantity)}</span>
                  </div>
                )}
                {item.appliedDiscount && (
                  <div className="flex justify-between text-red-600">
                    <span>Item discount:</span>
                    <span>-{formatPrice(item.appliedDiscount.amount * item.quantity)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Item total:</span>
                  <span>{formatPrice(item.itemTotal)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border-t p-6 space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span>{formatPrice(transaction.subtotal)}</span>
          </div>
          
          {itemDiscount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Item Discounts:</span>
              <span>-{formatPrice(itemDiscount)}</span>
            </div>
          )}

          {transaction.transactionDiscount && (
            <div className="flex justify-between text-red-600">
              <span>Transaction Discount:</span>
              <span>-{formatPrice(transaction.transactionDiscount.amount)}</span>
            </div>
          )}

          <div className="flex justify-between text-xl font-bold border-t pt-3">
            <span>Total Paid:</span>
            <span>{formatPrice(transaction.total)}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>COGS:</span>
            <span>{formatPrice(transaction.cogs)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
