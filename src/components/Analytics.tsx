import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { Id } from "../../convex/_generated/dataModel";

export function Analytics() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<Id<"transactions"> | null>(null);
  
  const weeklySales = useQuery(api.analytics.getWeeklySales);
  const monthlySales = useQuery(api.analytics.getMonthlySales);
  const menuItemRanking = useQuery(api.analytics.getMenuItemRanking, 
    dateRange ? {
      startDate: dateRange.start.getTime(),
      endDate: dateRange.end.getTime(),
    } : {}
  );
  const recentTransactions = useQuery(api.transactions.getCompletedTransactions, { limit: 10 });

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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalWeeklySales = weeklySales?.reduce((sum, day) => sum + day.total, 0) || 0;
  const totalMonthlySales = monthlySales?.reduce((sum, day) => sum + day.total, 0) || 0;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-1">This Week</h3>
          <p className="text-2xl font-bold text-green-600">{formatPrice(totalWeeklySales)}</p>
          <p className="text-xs text-gray-500">Mon-Fri</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Last 30 Days</h3>
          <p className="text-2xl font-bold text-blue-600">{formatPrice(totalMonthlySales)}</p>
          <p className="text-xs text-gray-500">Total sales</p>
        </div>
      </div>

      {/* Weekly Sales Chart */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Weekly Sales (Mon-Fri)</h3>
        <div className="space-y-3">
          {weeklySales?.map((day) => (
            <div key={day.day} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{day.day}</span>
              <div className="flex items-center space-x-3 flex-1 ml-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${totalWeeklySales > 0 ? (day.total / totalWeeklySales) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900 min-w-[80px] text-right">
                  {formatPrice(day.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Item Ranking */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Top Menu Items</h3>
        <div className="space-y-3">
          {menuItemRanking?.slice(0, 5).map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{item.quantity} sold</div>
                <div className="text-xs text-gray-500">{formatPrice(item.revenue)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {recentTransactions?.map((transaction) => (
            <button
              key={transaction._id}
              onClick={() => setSelectedTransactionId(transaction._id)}
              className="w-full text-left border-b border-gray-100 pb-3 last:border-b-0 hover:bg-gray-50 rounded p-2 transition-colors"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(transaction._creationTime)}
                </span>
                <span className="text-sm font-bold text-green-600">
                  {formatPrice(transaction.total)}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {transaction.items.length} items • 
                {transaction.items.reduce((sum, item) => sum + item.quantity, 0)} qty
                {transaction.transactionDiscount && (
                  <span className="ml-2 text-red-600">• Transaction discount applied</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransactionId && (
        <TransactionDetailModal
          transactionId={selectedTransactionId}
          onClose={() => setSelectedTransactionId(null)}
        />
      )}
    </div>
  );
}
