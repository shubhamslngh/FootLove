"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import {
  tabListClassName,
  tabTriggerActiveClassName,
  tabTriggerBaseClassName,
  tabTriggerOrbClassName,
} from "@/lib/tab-styles";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabListClassName, className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      tabTriggerBaseClassName,
      tabTriggerActiveClassName,
      tabTriggerOrbClassName,
      className
    )}
    {...props}
  >
    <span className="relative z-10 flex items-center justify-center gap-2">
      {children}
    </span>
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn("mt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
