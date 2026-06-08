"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3, IndianRupee, Link as LinkIcon, MapPinPlus, Plus, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MatchCard } from "@/components/match-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentYearDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfYear = new Date(today.getFullYear(), 11, 31);
  const dates = [];

  for (
    const date = new Date(today);
    date <= endOfYear;
    date.setDate(date.getDate() + 1)
  ) {
    dates.push({
      value: toDateValue(date),
      label: new Intl.DateTimeFormat("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "long",
      }).format(date),
    });
  }

  return dates;
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? "00" : "30";
  const value = `${String(hours).padStart(2, "0")}:${minutes}`;
  return { value, label: value };
});

export function HostMatchForm({ venues, paymentMethod, initialMatch = null }) {
  const router = useRouter();
  const [venueList, setVenueList] = useState(venues);
  const approvedVenues = venueList.filter((venue) => !venue.status || venue.status === "approved");
  const [venueId, setVenueId] = useState(initialMatch?.venueId || approvedVenues[0]?.id || "");
  const [activeStep, setActiveStep] = useState("details");
  const [format, setFormat] = useState(initialMatch?.format || "7v7");
  const [level, setLevel] = useState(initialMatch?.level || "Open");
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [match, setMatch] = useState({
    title: initialMatch?.title || "",
    homeTeam: initialMatch?.homeTeam || "",
    awayTeam: initialMatch?.awayTeam || "",
    date: initialMatch?.date || "",
    time: initialMatch?.time || "",
    price: initialMatch?.price || "",
    upiId: paymentMethod?.upiId || initialMatch?.upiId || "",
    upiPayeeName: paymentMethod?.payeeName || initialMatch?.upiPayeeName || "",
    paymentLink: initialMatch?.paymentLink || "",
    qrCodeDataUrl: paymentMethod?.qrCodeDataUrl || initialMatch?.qrCodeDataUrl || "",
    slotRoles: Array.isArray(initialMatch?.slotRoles)
      ? initialMatch.slotRoles.join(", ")
      : initialMatch?.slotRoles || "",
    notes: initialMatch?.notes || "",
  });
  const [message, setMessage] = useState("");
  const [venueMessage, setVenueMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const dateOptions = getCurrentYearDates();

  function updateMatch(field, value) {
    setMatch((current) => ({ ...current, [field]: value }));
  }

  async function submitMatch() {
    setMessage("");
    setLoading(true);

    const response = await fetch(
      initialMatch ? `/api/matches/${initialMatch.id}` : "/api/matches",
      {
      method: initialMatch ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: match.title,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        format,
        level,
        date: match.date,
        time: match.time,
        price: match.price,
        upiId: match.upiId,
        upiPayeeName: match.upiPayeeName,
        paymentLink: match.paymentLink,
        qrCodeDataUrl: match.qrCodeDataUrl,
        venueId,
        slotRoles: match.slotRoles,
        notes: match.notes,
      }),
      },
    );

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result?.error?.message || `Could not ${initialMatch ? "update" : "publish"} match`);
      return;
    }

    setMessage(initialMatch ? "Match updated" : "Match published");
    if (initialMatch) {
      router.push("/matches");
      router.refresh();
      return;
    }
    setMatch({
      title: "",
      homeTeam: "",
      awayTeam: "",
      date: "",
      time: "",
      price: "",
      upiId: paymentMethod?.upiId || "",
      upiPayeeName: paymentMethod?.payeeName || "",
      paymentLink: "",
      qrCodeDataUrl: paymentMethod?.qrCodeDataUrl || "",
      slotRoles: "",
      notes: "",
    });
    router.refresh();
  }

  async function createVenue(event) {
    event.preventDefault();
    setVenueMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/venues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("venueName"),
        area: formData.get("venueArea"),
        city: formData.get("venueCity"),
        address: formData.get("venueAddress"),
        mapUrl: formData.get("venueMapUrl"),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setVenueMessage(result?.error?.message || "Could not create venue");
      return;
    }

    setVenueList((current) => [...current, result.data.venue]);
    if (!result.data.venue.status || result.data.venue.status === "approved") {
      setVenueId(result.data.venue.id);
      setVenueMessage("Venue added and selected");
    } else {
      setVenueMessage("Venue sent to admin for approval");
    }
    form.reset();
    setShowVenueForm(false);
    router.refresh();
  }

  function uploadQrCode(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => updateMatch("qrCodeDataUrl", String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  const selectedVenue = venueList.find((venue) => venue.id === venueId);
  const previewMatch = {
    id: "match-preview",
    title: match.title || "Your match title",
    homeTeam: match.homeTeam || "Home team",
    awayTeam: match.awayTeam || "Away team",
    date: match.date || new Date().toISOString().slice(0, 10),
    time: match.time || "Select time",
    format,
    level,
    capacity: Number(format.split("v")[0]) * 2,
    booked: 0,
    price: Number(match.price) || 0,
    status: "preview",
    venue: selectedVenue || { name: "Select a venue", area: "" },
  };

  return (
    <div>
      <Tabs value={activeStep} onValueChange={setActiveStep}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="venue">Venue</TabsTrigger>
          <TabsTrigger value="payment">Payment setup</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>{initialMatch ? "Edit match" : "Match details"}</CardTitle>
              <CardDescription>
                Title, format, timing, price, and UPI destination.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 justify-around">
              <Field label="Match title">
                <Input
                  value={match.title}
                  onChange={(event) => updateMatch("title", event.target.value)}
                  placeholder="Match title"
                  required
                />
              </Field>
              <div
                className="flex
              gap-4 sm:grid-cols-3">
                <Field label="Home team">
                  <Input
                    value={match.homeTeam}
                    onChange={(event) =>
                      updateMatch("homeTeam", event.target.value)
                    }
                    placeholder="Home team name"
                    required
                  />
                </Field>
                <p className="text-2xl   p-2 mt-auto">VS</p>
                <Field label="Away team">
                  <Input
                    value={match.awayTeam}
                    onChange={(event) =>
                      updateMatch("awayTeam", event.target.value)
                    }
                    placeholder="Away team name"
                    required
                  />
                </Field>
              </div>
              <div className="flex gap-4 justify-around md:justify-center sm:grid-cols-2"> 
                <Field label="Format">
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5v5">5v5</SelectItem>
                      <SelectItem value="7v7">7v7</SelectItem>
                      <SelectItem value="8v8">8v8</SelectItem>
                      <SelectItem value="11v11">11v11</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Skill level">
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="flex gap-3">
                <div className="min-w-0 flex-1">
                <IconField icon={CalendarDays} label="Date">
                  <Select
                    value={match.date}
                    onValueChange={(value) => updateMatch("date", value)}>
                    <SelectTrigger className="min-w-0 pl-10">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                      {dateOptions.map((date) => (
                        <SelectItem key={date.value} value={date.value}>
                          {date.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </IconField>
                </div>
                <div className="min-w-0 flex-1">
                <IconField icon={Clock3} label="Kickoff">
                  <Select
                    value={match.time}
                    onValueChange={(value) => updateMatch("time", value)}>
                    <SelectTrigger className="min-w-0 pl-10">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </IconField>
                </div>
              </div>
              <div>
                <IconField icon={IndianRupee} label="Price per player">
                  <Input
                    value={match.price}
                    onChange={(event) =>
                      updateMatch("price", event.target.value)
                    }
                    type="number"
                    min="1"
                    placeholder="450"
                    required
                  />
                </IconField>
              </div>
              <div className="grid gap-2">
                <p className="text-sm font-semibold">Live match preview</p>
                <MatchCard match={previewMatch} preview />
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={
                  !match.title ||
                  !match.homeTeam ||
                  !match.awayTeam ||
                  !match.date ||
                  !match.time ||
                  !match.price
                }
                onClick={() => setActiveStep("venue")}>
                <MapPinPlus /> Select venue
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="venue">
          <Card>
            <CardHeader>
              <CardTitle>Venue and location</CardTitle>
              <CardDescription>
                Select an approved venue or submit a new one for admin approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Venue">
                <Select value={venueId} onValueChange={setVenueId}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        approvedVenues.length
                          ? "Select venue"
                          : "Add an approved venue first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedVenues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}, {venue.area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {!approvedVenues.length && (
                <p className="rounded-2xl bg-secondary p-3 text-sm font-semibold text-muted-foreground">
                  No approved venues yet. Add a venue and wait for admin
                  approval.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={() => setShowVenueForm((current) => !current)}>
                <MapPinPlus />
                {showVenueForm ? "Close venue form" : "Add new venue"}
              </Button>
              {showVenueForm && (
                <div className="rounded-2xl bg-secondary p-3">
                  <VenueCreateForm
                    onSubmit={createVenue}
                    message={venueMessage}
                  />
                </div>
              )}
              <Button
                type="button"
                className="w-full"
                disabled={!venueId}
                onClick={() => setActiveStep("payment")}>
                <QrCode />
                Continue to payment setup
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment setup</CardTitle>
              <CardDescription>
                Configure available roles and how players pay.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Available roles">
                <Input
                  value={match.slotRoles}
                  onChange={(event) =>
                    updateMatch("slotRoles", event.target.value)
                  }
                  placeholder="Forward, Midfield, Defender, Goalkeeper"
                />
              </Field>
              <IconField icon={LinkIcon} label="Payment link">
                <Input
                  value={match.paymentLink}
                  onChange={(event) =>
                    updateMatch("paymentLink", event.target.value)
                  }
                  type="url"
                  placeholder="https://pay.example.com/match"
                />
              </IconField>
              {paymentMethod ? (
                <div className="overflow-hidden rounded-2xl bg-foreground p-4 text-background shadow-[0_16px_34px_rgba(17,24,39,0.18)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <QrCode className="size-4" />
                        <p className="text-xs font-bold uppercase text-background/70">
                          Verified payment
                        </p>
                      </div>
                      <p className="mt-5 text-xs text-background/65">
                        Payee name
                      </p>
                      <p className="truncate text-lg font-bold">
                        {paymentMethod.payeeName}
                      </p>
                      <p className="mt-3 text-xs text-background/65">
                        UPI ID
                      </p>
                      <p className="break-all font-mono text-sm font-semibold">
                        {paymentMethod.upiId}
                      </p>
                    </div>
                    {paymentMethod.qrCodeDataUrl && (
                      <img
                        className="size-24 shrink-0 rounded-xl bg-white object-contain p-2"
                        src={paymentMethod.qrCodeDataUrl}
                        alt="Verified payment QR code"
                      />
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-background/15 pt-3 text-xs">
                    <span className="text-background/65">FootLove Host</span>
                    <span className="font-bold text-primary">
                      Admin verified
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 rounded-2xl bg-secondary p-3">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Manager UPI ID">
                      <Input
                        value={match.upiId}
                        onChange={(event) =>
                          updateMatch("upiId", event.target.value)
                        }
                        placeholder="manager@upi"
                        required
                      />
                    </Field>
                    <Field label="UPI payee name">
                      <Input
                        value={match.upiPayeeName}
                        onChange={(event) =>
                          updateMatch("upiPayeeName", event.target.value)
                        }
                        placeholder="Manager or venue name"
                      />
                    </Field>
                  </div>
                  <Field label="Upload payment QR">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={uploadQrCode}
                    />
                  </Field>
                  {match.qrCodeDataUrl && (
                    <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                      <img
                        className="size-16 rounded-2xl bg-white object-cover p-1 shadow-[0_8px_22px_rgba(17,24,39,0.08)] ring-1 ring-border"
                        src={match.qrCodeDataUrl}
                        alt="Uploaded payment QR code"
                      />
                      <span className="flex items-center gap-2">
                        <QrCode className="size-4" /> QR attached
                      </span>
                    </div>
                  )}
                </div>
              )}
              <Field label="Manager notes">
                <Input
                  value={match.notes}
                  onChange={(event) => updateMatch("notes", event.target.value)}
                  placeholder="Rules, equipment, arrival notes, payment instructions"
                />
              </Field>
              {message && (
                <p className="rounded-2xl bg-secondary p-3 text-sm font-semibold">
                  {message}
                </p>
              )}
              <Button
                type="button"
                className="w-full"
                disabled={loading || !venueId}
                onClick={submitMatch}>
                <Plus /> {loading ? "Publishing..." : "Publish match"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VenueCreateForm({ onSubmit, message }) {
  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Input name="venueName" placeholder="Venue name" required />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="venueArea" placeholder="Area" required />
        <Input name="venueCity" placeholder="City" required />
      </div>
      <Input name="venueAddress" placeholder="Full address" />
      <Input name="venueMapUrl" placeholder="Google Maps URL" />
      {message && <p className="text-sm font-semibold text-muted-foreground">{message}</p>}
      <Button type="submit" variant="outline">
        <Plus /> Add venue
      </Button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      {children}
    </label>
  );
}

function IconField({ icon: Icon, label, children }) {
  return (
    <Field label={label}>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <div className="[&_input]:pl-10">{children}</div>
      </div>
    </Field>
  );
}
