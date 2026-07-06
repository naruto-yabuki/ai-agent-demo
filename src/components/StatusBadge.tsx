import { ApprovalStatus, InvoiceStatus, Priority } from "@/types";
import { approvalStatusColors, approvalStatusLabels, invoiceStatusColors, invoiceStatusLabels, priorityColors } from "@/lib/statusLabels";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${invoiceStatusColors[status]}`}>
      {invoiceStatusLabels[status]}
    </span>
  );
}

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${approvalStatusColors[status]}`}>
      {approvalStatusLabels[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${priorityColors[priority]}`}>
      {priority}
    </span>
  );
}
