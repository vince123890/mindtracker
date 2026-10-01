"use client";

import { switchUser } from "@/app/actions";

interface Option {
  id: string;
  label: string;
}

export function RoleSwitcher({ users, currentId }: { users: Option[]; currentId: string }) {
  return (
    <form action={switchUser} className="flex items-center gap-2">
      <label htmlFor="userId" className="text-xs text-slate-500">
        Masuk sebagai
      </label>
      <select
        id="userId"
        name="userId"
        defaultValue={currentId}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.label}
          </option>
        ))}
      </select>
    </form>
  );
}
