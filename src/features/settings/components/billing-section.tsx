"use client";

import React, { useState } from "react";
import {
  useSubscription,
  usePaymentAttempts,
} from "@clerk/nextjs/experimental";
import { useClerk } from "@clerk/nextjs";
import { useSubscriptions } from "@/trpc/hooks/use-subscriptions";
import { Button } from "@/components/ui/button";
import {
  Loader2Icon,
  SparklesIcon,
  CreditCardIcon,
  AlertCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Plan header ──────────────────────────────────────────────────────────────

function PlanHeader() {
  const { data: sub, isLoading } = useSubscription();
  const { planLabel, isFree } = useSubscriptions();
  const { openUserProfile } = useClerk();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2Icon className="size-3.5 animate-spin" />
        Loading...
      </div>
    );
  }

  const activeItem = sub?.subscriptionItems?.find((i) => i.status === "active");

  const planPeriod = activeItem?.planPeriod ?? "month";
  const nextPayment = sub?.nextPayment;

  const isCanceled =
    sub?.subscriptionItems?.some(
      (i) => i.canceledAt !== null || i.status === "ended",
    ) ?? false;
  const endDate = nextPayment?.date ?? null;

  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <SparklesIcon className="size-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">{planLabel} plan</p>

          {!isFree && (
            <p className="text-xs text-muted-foreground capitalize">
              {planPeriod === "annual" ? "Annual" : "Monthly"}
            </p>
          )}

          {isCanceled && endDate ? (
            <p className="text-xs text-amber-500 mt-0.5">
              Expires{" "}
              {new Date(endDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          ) : nextPayment ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              Renews{" "}
              {new Date(nextPayment.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              · {nextPayment.amount.amountFormatted}
            </p>
          ) : null}
        </div>
      </div>

      {isFree ? (
        <Link href="/pricing">
          <Button size="sm" className="shrink-0">
            <SparklesIcon className="size-3" />
            Upgrade
          </Button>
        </Link>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={() => openUserProfile()}
        >
          Manage
        </Button>
      )}
    </div>
  );
}

// ─── Payment history ──────────────────────────────────────────────────────────

function PaymentHistory() {
  const { data: payments, isLoading } = usePaymentAttempts({
    for: "user",
    pageSize: 20,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2Icon className="size-3.5 animate-spin" />
        Loading payments...
      </div>
    );
  }

  const paid = payments?.filter((p) => p.status === "paid") ?? [];

  if (paid.length === 0) {
    return <p className="text-sm text-muted-foreground">No payments yet.</p>;
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 bg-muted/40 border-b border-border">
        <p className="text-xs text-muted-foreground font-medium">Date</p>
        <p className="text-xs text-muted-foreground font-medium">Amount</p>
        <p className="text-xs text-muted-foreground font-medium">Status</p>
      </div>

      {/* Rows */}
      {paid.map((payment) => (
        <div
          key={payment.id}
          className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
        >
          <p className="text-sm">
            {payment.paidAt
              ? new Date(payment.paidAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </p>

          <p className="text-sm tabular-nums">
            {payment.amount.amountFormatted}
          </p>

          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium w-fit",
              payment.status === "paid"
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
            )}
          >
            {payment.status === "paid" ? "Paid" : payment.status}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Cancel dialog ────────────────────────────────────────────────────────────

function CancelSection() {
  const { isFree } = useSubscriptions();
  const { data: sub } = useSubscription();
  const { openUserProfile } = useClerk();
  const [open, setOpen] = useState(false);

  if (isFree) return null;

  const isCanceled =
    sub?.subscriptionItems?.some(
      (i) => i.canceledAt !== null || i.status === "ended",
    ) ?? false;

  if (isCanceled) {
    const endDate = sub?.nextPayment?.date;

    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
        <AlertCircleIcon className="size-4 text-amber-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Subscription canceled
          </p>

          {endDate && (
            <p className="text-xs text-muted-foreground mt-0.5">
              You&apos;ll have access until{" "}
              {new Date(endDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              . After that, your account reverts to the Free plan.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between py-4 border-t border-border">
        <div>
          <p className="text-sm font-medium">Cancel subscription</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            You&apos;ll keep access until the end of your billing period.
          </p>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setOpen(true)}
          className="shrink-0"
        >
          Cancel plan
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel your subscription?</DialogTitle>
            <DialogDescription>
              You&apos;ll keep full access until the end of your current billing
              period. After that, your account will revert to the Free plan and
              you&apos;ll lose access to paid features.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep subscription
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                setOpen(false);
                openUserProfile();
              }}
            >
              Continue to cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function BillingSection() {
  const { isFree } = useSubscriptions();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Billing</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription and view payment history.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Current plan</h3>
        <PlanHeader />
      </div>

      {!isFree && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Payment method</h3>
          <PaymentMethodRow />
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Payment history</h3>
        <PaymentHistory />
      </div>

      <CancelSection />
    </div>
  );
}

// ─── Payment method row ───────────────────────────────────────────────────────

function PaymentMethodRow() {
  const { openUserProfile } = useClerk();
  const { data: payments } = usePaymentAttempts({ for: "user", pageSize: 1 });

  const lastPayment = payments?.[0];
  const method = lastPayment?.paymentMethod;

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-muted/30">
      <div className="flex items-center gap-2.5">
        <CreditCardIcon className="size-4 text-muted-foreground shrink-0" />

        {method ? (
          <p className="text-sm">
            {method.cardType ?? "Card"} ending in {method.last4 ?? "••••"}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No payment method on file
          </p>
        )}
      </div>

      <Button variant="outline" size="sm" onClick={() => openUserProfile()}>
        Update
      </Button>
    </div>
  );
}
