import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { Id } from "../../convex/_generated/dataModel";

export function Analytics() {
  const getInitialDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => getInitialDateRange());
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [selectedTransactionId, setSelectedTransactionId] = useState<Id<"transactions"> | null>(null);

  const selectedRange = useMemo(() => {
    if (!dateRange?.start || !dateRange?.end) {
      return null;
    }

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return {
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
    };
  }, [dateRange]);

  useEffect(() => {
    setCursorStack([null]);
  }, [selectedRange?.startDate, selectedRange?.endDate]);

  const weeklySales = useQuery(api.analytics.getWeeklySales);
  const monthlySales = useQuery(api.analytics.getMonthlySales);
  const menuItemRanking = useQuery(
    api.analytics.getMenuItemRanking,
    selectedRange
      ? {
          startDate: selectedRange.startDate,
          endDate: selectedRange.endDate,
        }
      : {}
  );
  const rangeSalesSummary = useQuery(
    api.analytics.getSalesTotalForDateRange,
    selectedRange
      ? {
          startDate: selectedRange.startDate,
          endDate: selectedRange.endDate,
        }
      : {}
  );
  const currentCursor = cursorStack[cursorStack.length - 1] ?? null;
  const transactionsPage = useQuery(api.transactions.getTransactionsByDateRange, {
    startDate: selectedRange?.startDate,
    endDate: selectedRange?.endDate,
    paginationOpts: {
      numItems: 10,
      cursor: currentCursor,
    },
  });

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
  const rangeTotalSales = rangeSalesSummary?.totalSales || 0;
  const rangeTransactionCount = rangeSalesSummary?.transactionCount || 0;
  const transactions = transactionsPage?.page || [];
  const hasNextPage = Boolean(transactionsPage && !transactionsPage.isDone);
  const isFirstPage = cursorStack.length === 1;

  const handleDateChange = (key: "start" | "end", value: string) => {
    setDateRange((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearDateRange = () => {
    setDateRange(getInitialDateRange());
  };

  const handleNextPage = () => {
    if (transactionsPage?.continueCursor) {
      setCursorStack((prev) => [...prev, transactionsPage.continueCursor]);
    }
  };

  const handlePreviousPage = () => {
    if (cursorStack.length > 1) {
      setCursorStack((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Selected Range</h3>
          <p className="text-2xl font-bold text-purple-600">{formatPrice(rangeTotalSales)}</p>
          <p className="text-xs text-gray-500">
            {rangeTransactionCount} transactions
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex flex-col gap-4 md:items-center md:flex-row md:justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Custom Date Range</h3>
            <p className="text-sm text-gray-500">
              Filter analytics, top menu items, and transactions for the selected dates.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <label className="flex flex-col text-sm text-gray-600 w-full">
              Start Date
              <input
                type="date"
                value={dateRange.start}
                onChange={(event) => handleDateChange("start", event.target.value)}
                className="mt-1 border rounded-md px-3 py-2 text-gray-900"
              />
            </label>
            <label className="flex flex-col text-sm text-gray-600 w-full">
              End Date
              <input
                type="date"
                value={dateRange.end}
                onChange={(event) => handleDateChange("end", event.target.value)}
                className="mt-1 border rounded-md px-3 py-2 text-gray-900"
              />
            </label>
            <button
              onClick={handleClearDateRange}
              className="h-10 mt-6 sm:mt-0 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
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

      {/* Transactions by Date Range */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Transactions</h3>
            <p className="text-sm text-gray-500">
              Showing up to 10 transactions per page within the selected dates.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={isFirstPage}
              className="px-3 py-1 text-sm border rounded disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={!hasNextPage}
              className="px-3 py-1 text-sm border rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {transactions.map((transaction) => (
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
          {transactions.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-4">
              No transactions found for the selected dates.
            </div>
          )}
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
