"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  ImagePlus,
  LockKeyhole,
  Phone,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileForm({ user }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user.name || "",
    username: user.username || "",
    phone: user.phone || "",
    profileImageDataUrl: user.profileImageDataUrl || "",
    pin: "",
    confirmPin: "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    if (form.pin && form.pin !== form.confirmPin) {
      setMessage("PINs do not match");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/auth/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        username: form.username,
        phone: form.phone,
        pin: form.pin,
        profileImageDataUrl: form.profileImageDataUrl,
      }),
    });
    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(result?.error?.message || "Could not update profile");
      return;
    }

    setForm((current) => ({ ...current, pin: "", confirmPin: "" }));
    setMessage("Profile updated");
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-2">
        <p className="text-sm font-semibold">Profile photo</p>
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-secondary p-3">
          {form.profileImageDataUrl ? (
            <img
              src={form.profileImageDataUrl}
              alt="Profile preview"
              className="size-20 rounded-full object-cover ring-2 ring-background"
            />
          ) : (
            <div className="grid size-20 place-items-center rounded-full bg-background text-xl font-black">
              {getInitials(form.name)}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" asChild>
              <label className="cursor-pointer">
                <ImagePlus />
                Choose photo
                <input
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setMessage("Preparing photo...");
                    try {
                      update("profileImageDataUrl", await compressImage(file));
                      setMessage("");
                    } catch (error) {
                      setMessage(error.message || "Could not read photo");
                    }
                    event.target.value = "";
                  }}
                />
              </label>
            </Button>
            {form.profileImageDataUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={() => update("profileImageDataUrl", "")}>
                <Trash2 />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      <ProfileInput icon={UserRound} label="Full name">
        <Input
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          required
        />
      </ProfileInput>
      <ProfileInput icon={AtSign} label="Username">
        <Input
          value={form.username}
          onChange={(event) =>
            update(
              "username",
              event.target.value
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "")
                .slice(0, 20),
            )
          }
          required
        />
      </ProfileInput>
      <ProfileInput icon={Phone} label="Mobile number">
        <Input
          value={form.phone}
          onChange={(event) =>
            update(
              "phone",
              event.target.value.replace(/\D/g, "").slice(0, 10),
            )
          }
          type="tel"
          inputMode="numeric"
          required
        />
      </ProfileInput>

      <div className="grid gap-3 border-t border-border pt-4">
        <div>
          <p className="text-sm font-bold">Change login PIN</p>
          <p className="text-xs text-muted-foreground">
            Leave blank to keep your current PIN.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileInput icon={LockKeyhole} label="New 6-digit PIN">
            <PinInput
              value={form.pin}
              onChange={(value) => update("pin", value)}
            />
          </ProfileInput>
          <ProfileInput icon={LockKeyhole} label="Confirm new PIN">
            <PinInput
              value={form.confirmPin}
              onChange={(value) => update("confirmPin", value)}
            />
          </ProfileInput>
        </div>
      </div>

      {message && (
        <p className="rounded-2xl bg-secondary p-3 text-sm font-semibold">
          {message}
        </p>
      )}
      <Button disabled={saving}>
        <Save />
        {saving ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}

function compressImage(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Promise.reject(new Error("Choose a JPEG, PNG, or WebP image"));
  }
  if (file.size > 8 * 1024 * 1024) {
    return Promise.reject(new Error("Choose an image smaller than 8 MB"));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read photo"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not process photo"));
      image.onload = () => {
        const size = Math.min(image.width, image.height);
        const canvas = document.createElement("canvas");
        canvas.width = 720;
        canvas.height = 720;
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("Could not process photo"));
        context.drawImage(
          image,
          (image.width - size) / 2,
          (image.height - size) / 2,
          size,
          size,
          0,
          0,
          720,
          720,
        );
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function getInitials(name = "") {
  return name
    .split(/\s+/)
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ProfileInput({ icon: Icon, label, children }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <div className="[&_input]:pl-10">{children}</div>
      </div>
    </label>
  );
}

function PinInput({ value, onChange }) {
  return (
    <Input
      value={value}
      onChange={(event) =>
        onChange(event.target.value.replace(/\D/g, "").slice(0, 6))
      }
      type="password"
      inputMode="numeric"
      maxLength={6}
      placeholder="••••••"
      className="text-center tracking-[0.3em]"
      autoComplete="new-password"
    />
  );
}
