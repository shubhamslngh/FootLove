"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, Plus, Send, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateClubForm() {
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
    setMessage("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        city: form.get("city"),
        description: form.get("description"),
        logoDataUrl,
      }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result?.error?.message || "Could not create club");
      return;
    }
    event.currentTarget.reset();
    setLogoDataUrl("");
    setMessage("Club created");
    router.refresh();
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <Input name="name" placeholder="Club name" required />
      <Input name="city" placeholder="City" required />
      <Input
        name="description"
        placeholder="Short description or playing style"
      />
      <label className="grid gap-2 text-sm font-semibold">
        Club logo
        <Input type="file" accept="image/*" onChange={uploadLogo} required />
      </label>
      {logoDataUrl && (
        <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
          <img
            src={logoDataUrl}
            alt="Club logo preview"
            className="size-16 rounded-full bg-white object-cover p-1 ring-1 ring-border"
          />
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <ImagePlus className="size-4" /> Logo ready
          </span>
        </div>
      )}
      {message && <Status>{message}</Status>}
      <Button disabled={loading || !logoDataUrl}>
        <Plus />
        {loading ? "Creating..." : "Create club"}
      </Button>
    </form>
  );
}

export function JoinClubButton({ clubId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function join() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/clubs/${clubId}/join`, {
      method: "POST",
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result?.error?.message || "Could not join club");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-1">
      <Button type="button" size="sm" variant="outline" onClick={join} disabled={loading}>
        <UserPlus />
        {loading ? "Joining..." : "Join club"}
      </Button>
      {message && <Status>{message}</Status>}
    </div>
  );
}

export function ChallengeClubForm({ captainClubs, targetClub }) {
  const router = useRouter();
  const [challengerClubId, setChallengerClubId] = useState(
    captainClubs[0]?.id || "",
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/clubs/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengerClubId,
        challengedClubId: targetClub.id,
        proposedDate: form.get("proposedDate"),
        proposedTime: form.get("proposedTime"),
        venueNote: form.get("venueNote"),
        message: form.get("message"),
      }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result?.error?.message || "Could not send challenge");
      return;
    }
    setMessage("Challenge sent");
    router.refresh();
  }

  return (
    <form className="grid gap-2 border-t border-border pt-3" onSubmit={submit}>
      <p className="text-xs font-bold uppercase text-muted-foreground">
        Challenge {targetClub.name}
      </p>
      {captainClubs.length > 1 && (
        <Select value={challengerClubId} onValueChange={setChallengerClubId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {captainClubs.map((club) => (
              <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Input name="proposedDate" type="date" required />
        <Input name="proposedTime" type="time" required />
      </div>
      <Input name="venueNote" placeholder="Suggested venue" />
      <Input name="message" placeholder="Challenge message" />
      {message && <Status>{message}</Status>}
      <Button size="sm" disabled={loading || !challengerClubId}>
        <Send />
        {loading ? "Sending..." : "Send challenge"}
      </Button>
    </form>
  );
}

export function ChallengeResponseActions({ challengeId }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");

  async function respond(action) {
    setLoading(action);
    setMessage("");
    const response = await fetch(`/api/clubs/challenges/${challengeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const result = await response.json();
    setLoading("");
    if (!response.ok) {
      setMessage(result?.error?.message || "Could not respond");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" disabled={Boolean(loading)} onClick={() => respond("accept")}>
          <Check /> {loading === "accept" ? "Accepting..." : "Accept"}
        </Button>
        <Button size="sm" variant="outline" disabled={Boolean(loading)} onClick={() => respond("decline")}>
          <X /> {loading === "decline" ? "Declining..." : "Decline"}
        </Button>
      </div>
      {message && <Status>{message}</Status>}
    </div>
  );
}

function Status({ children }) {
  return <p className="text-xs font-semibold text-muted-foreground">{children}</p>;
}
