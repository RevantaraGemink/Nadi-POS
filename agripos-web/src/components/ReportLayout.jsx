import React from 'react';
import { formatCurrentDateTime } from '../utils/dateTime';

/**
 * ReportLayout - a reusable header layout for report pages.
 * Consistent with the design system defined in `plans/stitch_agripos_sales_system/Laporan New`.
 * Displays title, optional subtitle, and the current date & time on the right.
 */
export default function ReportLayout({ title, subtitle }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-surface-container-low rounded-DEFAULT mb-6 border border-outline-variant">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">{title}</h1>
        {subtitle && <p className="text-on-surface-variant mt-1">{subtitle}</p>}
      </div>
      <span className="text-on-surface-variant font-table-data" aria-label="Tanggal dan waktu laporan">
        {formatCurrentDateTime()}
      </span>
    </div>
  );
}
