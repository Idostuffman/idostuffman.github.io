import "server-only";
import { connection } from "next/server";
import { getRepository } from "./repository";
import { fetchRemoteContent, remoteConfigured } from "./remote";
import type { SiteContent } from "./schema";

export async function getContent(): Promise<SiteContent> {
  if (process.env.STATIC_EXPORT !== "1") await connection();
  return getContentAtBuild();
}

export async function getContentAtBuild(): Promise<SiteContent> {
  if (remoteConfigured()) {
    const remote = await fetchRemoteContent();
    if (remote) return remote;
  }
  return getRepository().load();
}
