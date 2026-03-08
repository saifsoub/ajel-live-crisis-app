import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard-client";
import { getSession } from "@/lib/auth";
import { buildBrief } from "@/lib/live";
import { getBookmarks, getSnapshots, getWatchlists } from "@/lib/storage";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [brief, watchlists, bookmarks, snapshots] = await Promise.all([
    buildBrief(),
    Promise.resolve(getWatchlists()),
    Promise.resolve(getBookmarks()),
    Promise.resolve(getSnapshots()),
  ]);

  return <DashboardClient initialData={{ brief, watchlists, bookmarks, snapshots }} />;
}
