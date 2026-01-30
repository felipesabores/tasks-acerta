import { ReactNode } from 'react';

interface ReportSectionProps {
  title: string;
  number: number;
  children: ReactNode;
}

export function ReportSection({ title, number, children }: ReportSectionProps) {
  return (
    <section className="mb-8 break-inside-avoid">
      <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-4">
        {number}. {title}
      </h2>
      <div className="text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

interface ReportTableProps {
  headers: string[];
  rows: (string | ReactNode)[][];
}

export function ReportTable({ headers, rows }: ReportTableProps) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse border border-border text-sm">
        <thead>
          <tr className="bg-muted">
            {headers.map((header, i) => (
              <th key={i} className="border border-border px-3 py-2 text-left font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
              {row.map((cell, j) => (
                <td key={j} className="border border-border px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ReportBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function ReportBadge({ children, variant = 'default' }: ReportBadgeProps) {
  const variants = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
