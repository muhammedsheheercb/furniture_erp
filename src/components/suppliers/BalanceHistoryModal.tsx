"use client";
import Modal from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { IBalanceHistory } from "@/types";

interface BalanceHistoryModalProps {
  open: boolean;
  onClose: () => void;
  entityName: string;
  history: IBalanceHistory[];
}

export default function BalanceHistoryModal({ open, onClose, entityName, history }: BalanceHistoryModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={`Balance History: ${entityName}`} size="lg">
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Amount</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {history.length > 0 ? (
              history.slice().reverse().map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(item.date)}
                  </td>
                  <td className={`px-4 py-3 text-sm font-bold text-right whitespace-nowrap ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'payment' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate" title={item.note}>
                    {item.note || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-gray-500 italic">No history recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
