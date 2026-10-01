import { Card, PageHeader } from "@/components/ui";
import { isMindId, requirePermission } from "@/lib/auth/session";
import { RCA_CATEGORIES, ROOT_CAUSE_6M } from "@/lib/db/do";
import { getOrganizations } from "@/lib/db/tracker";
import { RcaForm } from "../rca-form";

export default async function NewRcaPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission("do.rca.write");
  const sp = await searchParams;
  const orgs = (await getOrganizations()).filter((o) => o.kind === "MEMBER");
  const mind = isMindId(user);
  return (
    <div className="max-w-3xl">
      <PageHeader title="RCA Baru" subtitle="Data lahir di aplikasi ini (bukan hasil sinkron) · disimpan sebagai Draft" />
      <Card>
        <RcaForm
          orgs={orgs}
          orgLocked={!mind}
          categories={RCA_CATEGORIES}
          rootCauses={ROOT_CAUSE_6M}
          values={{
            organization_id: mind ? sp.org ?? orgs[0]?.id : user.organizationId,
            plant: sp.plant,
            product: sp.product,
            unit: sp.unit,
            period: sp.period,
            gap: sp.gap,
          }}
        />
      </Card>
    </div>
  );
}
