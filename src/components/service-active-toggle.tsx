"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setServiceActiveAction } from "@/app/actions";

export function ServiceActiveToggle({ serviceId, active }: { serviceId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (active && !window.confirm("Remove this program from the shop and signup? It stays in your records — you can bring it back anytime.")) {
      return;
    }
    startTransition(async () => {
      await setServiceActiveAction(serviceId, !active);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`text-sm underline disabled:opacity-50 ${active ? "text-red-400" : "text-brand"}`}
    >
      {active ? "Deactivate" : "Activate"}
    </button>
  );
}
