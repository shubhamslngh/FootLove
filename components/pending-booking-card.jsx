import { CalendarDays, CreditCard, Phone, UserRound } from "lucide-react";

import { BookingApprovalActions } from "@/components/booking-approval-actions";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/lib/utils";

export function PendingBookingCard({ booking }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-[0_12px_30px_rgba(17,24,39,0.08)] ring-1 ring-border">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
            <UserRound className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold">{booking.player.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {booking.match.title}
            </p>
          </div>
        </div>
        <Badge variant="secondary">Payment claimed</Badge>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border">
        <Detail icon={CalendarDays} label="Match">
          {formatDisplayDate(booking.match.date)}, {booking.match.time}
        </Detail>
        <Detail icon={Phone} label="Player">
          {booking.player.phone || "Guest booking"}
        </Detail>
        <Detail icon={UserRound} label="Slot">
          {booking.slotRole}
        </Detail>
        <Detail icon={CreditCard} label="UPI reference">
          {booking.paymentReference || "User did not provide one"}
        </Detail>
      </div>
      <div className="p-3">
        <BookingApprovalActions bookingId={booking.id} />
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="min-w-0 bg-card p-3">
      <Icon className="size-4 text-primary" />
      <p className="mt-2 text-[0.65rem] font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-bold">{children}</p>
    </div>
  );
}
