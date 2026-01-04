/**
 * Direct Answers Component
 * Optimized for featured snippets and voice search
 */

import { cn } from '@/lib/utils';
import type { DirectAnswersProps, TableRow } from '@/lib/seo/types';

export function DirectAnswers({ type, items, title, className }: DirectAnswersProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900',
        className
      )}
      role="region"
      aria-label={title || 'Informasi'}
    >
      {title && (
        <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">{title}</h3>
      )}

      {type === 'bullets' && <BulletList items={items as string[]} />}
      {type === 'numbered' && <NumberedList items={items as string[]} />}
      {type === 'table' && <DataTable rows={items as TableRow[]} />}
    </div>
  );
}

/**
 * Bullet List - for unordered featured snippets
 */
function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2" data-seo-list="bullets">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
        >
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Numbered List - for ordered featured snippets (steps, rankings)
 */
function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2" data-seo-list="numbered">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
            {index + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Data Table - for comparison featured snippets
 */
function DataTable({ rows }: { rows: TableRow[] }) {
  if (rows.length === 0) return null;

  // First row is header
  const [headerRow, ...bodyRows] = rows;

  return (
    <div className="overflow-x-auto" data-seo-table="true">
      <table className="w-full text-sm">
        {headerRow && (
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {headerRow.cells.map((cell, index) => (
                <th
                  key={index}
                  className="px-3 py-2 text-left font-semibold text-slate-900 dark:text-white"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {bodyRows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-slate-100 last:border-0 dark:border-slate-800"
            >
              {row.cells.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-3 py-2 text-slate-700 dark:text-slate-300"
                >
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

/**
 * Quick Answer - single line answer box
 */
export function QuickAnswer({
  question,
  answer,
  className,
}: {
  question: string;
  answer: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950/50',
        className
      )}
      data-seo-qa="true"
    >
      <p className="text-sm font-medium text-teal-800 dark:text-teal-200">{question}</p>
      <p className="mt-1 text-base text-teal-900 dark:text-teal-100">{answer}</p>
    </div>
  );
}

/**
 * Definition Box - for "what is" queries
 */
export function DefinitionBox({
  term,
  definition,
  className,
}: {
  term: string;
  definition: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border-l-4 border-teal-500 bg-slate-50 p-4 dark:bg-slate-900',
        className
      )}
      data-seo-definition="true"
    >
      <dt className="font-semibold text-slate-900 dark:text-white">{term}</dt>
      <dd className="mt-1 text-slate-700 dark:text-slate-300">{definition}</dd>
    </div>
  );
}

