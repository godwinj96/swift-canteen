import { HTMLAttributes, TableHTMLAttributes } from "react";

export function Table(props: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-canteen-light">
      <table className="w-full text-left text-sm" {...props} />
    </div>
  );
}

export function TableHead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="text-[11px] font-semibold tracking-[0.06em] text-canteen-dark uppercase" {...props} />;
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-line/60" {...props} />;
}

export function TableRow(props: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} />;
}

export function TableCell(props: HTMLAttributes<HTMLTableCellElement>) {
  return <td className="px-5 py-4 text-ink" {...props} />;
}

export function TableHeaderCell(props: HTMLAttributes<HTMLTableCellElement>) {
  return <th className="px-5 py-4 font-medium" {...props} />;
}
