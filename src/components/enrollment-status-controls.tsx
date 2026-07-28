"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setEnrollmentContractStatusAction, setEnrollmentInvoiceStatusAction } from "@/app/actions";

type ContractStatus = "NOT_SENT" | "SENT" | "SIGNED";
type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "PARTIALLY_PAID" | "VOID";

export function EnrollmentStatusControls({
  enrollmentId,
  contractStatus,
  invoiceStatus,
}: {
  enrollmentId: string;
  contractStatus: ContractStatus;
  invoiceStatus: InvoiceStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleContract(next: ContractStatus) {
    setError(null);
    startTransition(async () => {
      const result = await setEnrollmentContractStatusAction(enrollmentId, next);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleInvoice(next: "DRAFT" | "SENT" | "PAID") {
    setError(null);
    startTransition(async () => {
      const result = await setEnrollmentInvoiceStatusAction(enrollmentId, next);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          disabled={pending}
          checked={contractStatus !== "NOT_SENT"}
          onChange={(e) => handleContract(e.target.checked ? "SENT" : "NOT_SENT")}
        />
        Contract Sent
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          disabled={pending}
          checked={contractStatus === "SIGNED"}
          onChange={(e) => handleContract(e.target.checked ? "SIGNED" : "SENT")}
        />
        Contract Signed
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          disabled={pending}
          checked={invoiceStatus !== "DRAFT"}
          onChange={(e) => handleInvoice(e.target.checked ? "SENT" : "DRAFT")}
        />
        Invoice Sent
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          disabled={pending}
          checked={invoiceStatus === "PAID"}
          onChange={(e) => handleInvoice(e.target.checked ? "PAID" : "SENT")}
        />
        Invoice Paid
      </label>
      {error && <p className="w-full text-red-400">{error}</p>}
    </div>
  );
}
