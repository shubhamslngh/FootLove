"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Link as LinkIcon, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateCommunityForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState("");

  function uploadLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return setLogoDataUrl("");
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        whatsappUrl: form.get("whatsappUrl"),
        logoDataUrl,
      }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result?.error?.message || "Could not create community");
      return;
    }
    event.currentTarget.reset();
    setLogoDataUrl("");
    setMessage("Community created");
    router.refresh();
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <Input name="name" placeholder="Community name" required />
      <Input name="description" placeholder="What is this community about?" required />
      <div className="relative">
        <LinkIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="whatsappUrl" className="pl-10" type="url" placeholder="https://chat.whatsapp.com/..." required />
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        Community logo
        <Input type="file" accept="image/*" onChange={uploadLogo} required />
      </label>
      {logoDataUrl && (
        <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
          <img
            src={logoDataUrl}
            alt="Community logo preview"
            className="size-16 rounded-full bg-white object-cover p-1 ring-1 ring-border"
          />
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <ImagePlus className="size-4" /> Logo ready
          </span>
        </div>
      )}
      {message && <p className="text-xs font-semibold text-muted-foreground">{message}</p>}
      <Button disabled={loading || !logoDataUrl}>
        <Plus /> {loading ? "Creating..." : "Create community"}
      </Button>
    </form>
  );
}

export function AddCommunityMatchForm({ communityId, matches }) {
  const router = useRouter();
  const [matchId, setMatchId] = useState(matches[0]?.id || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function add() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/communities/${communityId}/matches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result?.error?.message || "Could not add match");
      return;
    }
    setMessage("Match added");
    router.refresh();
  }

  if (!matches.length) {
    return <p className="text-xs text-muted-foreground">No completed matches available to add.</p>;
  }

  return (
    <div className="grid gap-2 border-t border-border pt-3">
      <p className="text-xs font-bold uppercase text-muted-foreground">Add past match</p>
      <Select value={matchId} onValueChange={setMatchId}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {matches.map((match) => (
            <SelectItem key={match.id} value={match.id}>
              {match.title} · {match.date}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" size="sm" variant="outline" disabled={loading} onClick={add}>
        <Plus /> {loading ? "Adding..." : "Add to history"}
      </Button>
      {message && <p className="text-xs font-semibold text-muted-foreground">{message}</p>}
    </div>
  );
}
