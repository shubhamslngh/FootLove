import { randomUUID } from "node:crypto";

import { readDb, updateDb } from "@/lib/server/db";
import { fail, ok, parseJson, requireUser } from "@/lib/server/http";

function validWhatsappUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      ["chat.whatsapp.com", "wa.me", "www.whatsapp.com"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

export async function GET() {
  const db = await readDb();
  return ok({
    communities: db.communities,
    communityMatches: db.communityMatches,
  });
}

export async function POST(request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await parseJson(request);
  const name = String(body?.name || "").trim();
  const description = String(body?.description || "").trim();
  const whatsappUrl = String(body?.whatsappUrl || "").trim();
  const logoDataUrl = String(body?.logoDataUrl || "").trim();

  if (!name || !description || !whatsappUrl || !logoDataUrl) {
    return fail("Name, description, WhatsApp group link, and logo are required");
  }
  if (!validWhatsappUrl(whatsappUrl)) {
    return fail("Enter a valid WhatsApp group link");
  }
  if (!logoDataUrl.startsWith("data:image/")) {
    return fail("Upload a valid community logo");
  }

  let result;
  await updateDb((db) => {
    if (
      db.communities.some(
        (community) => community.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      result = { error: "A community with this name already exists", status: 409 };
      return db;
    }
    const community = {
      id: `com_${randomUUID()}`,
      name,
      description,
      whatsappUrl,
      logoDataUrl,
      createdByUserId: user.id,
      createdAt: new Date().toISOString(),
    };
    db.communities.push(community);
    result = { community };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok(result, { status: 201 });
}
