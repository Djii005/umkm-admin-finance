'use client';
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function DataTable({
  columns,
  data,
  actions,
  onSearch,
  searchPlaceholder = 'Cari...',
  toolbar,
  emptyMessage = 'Tidak ada data',
}) {
  const [localSearch, setLocalSearch] = useState('');

  const filteredData = onSearch
    ? data
    : data.filter((row) => {
        if (!localSearch) return true;
        return columns.some((col) => {
          const val = col.accessor ? row[col.accessor] : '';
          return String(val || '').toLowerCase().includes(localSearch.toLowerCase());
        });
      });

  return (
    <div>
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <div className="search-input">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder={searchPlaceholder}
              value={onSearch ? undefined : localSearch}
              onChange={(e) => {
                if (onSearch) onSearch(e.target.value);
                else setLocalSearch(e.target.value);
              }}
            />
          </div>
        </div>
        {toolbar && <div className="table-toolbar-right">{toolbar}</div>}
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key || col.accessor}>{col.header}</th>
              ))}
              {actions && <th>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)}>
                  <div className="empty-state">
                    <p className="empty-state-text">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr key={row.id || idx}>
                  {columns.map((col) => (
                    <td key={col.key || col.accessor}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                  {actions && <td>{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
