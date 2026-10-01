"use client";

import { useActionState, type ReactNode } from "react";

export interface FormState {
  ok?: boolean;
  error?: string;
  items?: string[];
}

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** Form untuk server action: menampilkan galat spesifik dari server (bukan pesan generik). */
export function ActionForm({
  action,
  children,
  className = "",
  okMessage,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  okMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className} aria-busy={pending}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state.error ? (
        <div role="alert" className="mt-2 rounded border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">
          <div className="font-medium">{state.error}</div>
          {state.items?.length ? (
            <pre className="mt-1 whitespace-pre-wrap font-sans text-xs">{state.items.join("\n")}</pre>
          ) : null}
        </div>
      ) : null}
      {state.ok && (okMessage || state.items?.length) ? (
        <div className="mt-2 text-sm text-emerald-700">
          {okMessage}
          {state.items?.length ? <pre className="mt-1 whitespace-pre-wrap font-sans text-xs">{state.items.join("\n")}</pre> : null}
        </div>
      ) : null}
    </form>
  );
}
