import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  adminInventoryService,
  adminProductsService,
  type InventoryLog,
} from '@/services/products.service';

const InventoryAdminPanel: React.FC = () => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Fetch all products for the filter dropdown
  const { data: products = [] } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: adminProductsService.list,
  });

  // Fetch inventory logs, filtered by product if selected
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin', 'inventory', selectedProductId],
    queryFn: () => adminInventoryService.logs(selectedProductId || undefined),
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#111827]">Inventario / Movimientos</h2>
        <div>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5] bg-white"
          >
            <option value="">Todos los productos</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-[#F9FAFB]">
              {['Producto', 'Antes', 'Después', 'Cambio', 'Motivo', 'Fecha'].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#6B7280]">
                  Sin movimientos de inventario registrados
                </td>
              </tr>
            ) : (
              logs.map((log: InventoryLog) => {
                const change = log.quantity_after - log.quantity_before;
                const isPositive = change > 0;
                const isNeutral = change === 0;

                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    {/* Producto */}
                    <td className="px-4 py-3 text-sm font-medium text-[#111827] max-w-[200px] truncate">
                      {log.product_name}
                    </td>

                    {/* Antes */}
                    <td className="px-4 py-3 text-sm text-[#6B7280]">
                      {log.quantity_before}
                    </td>

                    {/* Después */}
                    <td className="px-4 py-3 text-sm text-[#6B7280]">
                      {log.quantity_after}
                    </td>

                    {/* Cambio */}
                    <td className="px-4 py-3 text-sm font-medium">
                      <span
                        className={
                          isNeutral
                            ? 'text-[#6B7280]'
                            : isPositive
                            ? 'text-[#10B981]'
                            : 'text-[#EF4444]'
                        }
                      >
                        {isPositive ? '+' : ''}{change}
                      </span>
                    </td>

                    {/* Motivo */}
                    <td className="px-4 py-3 text-sm text-[#6B7280] max-w-[200px] truncate">
                      {log.reason}
                    </td>

                    {/* Fecha */}
                    <td className="px-4 py-3 text-sm text-[#6B7280] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('es-MX')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryAdminPanel;
