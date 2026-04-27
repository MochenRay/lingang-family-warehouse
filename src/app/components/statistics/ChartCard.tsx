import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../ui/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  info?: string;
  className?: string;
  loading?: boolean;
}

export function ChartCard({ 
  title, 
  description, 
  children, 
  action, 
  info,
  className,
  loading = false
}: ChartCardProps) {
  return (
    <Card
      className={cn(
        "gap-4 rounded-[8px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none hover:shadow-[var(--shadow-02)]",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pb-2 pt-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-[var(--color-neutral-11)]">{title}</CardTitle>
            {info && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label={`${title}说明`} className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] shadow-[var(--shadow-02)]">
                    <p className="max-w-xs text-sm">{info}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {description && (
            <CardDescription className="text-sm text-[var(--color-neutral-08)]">{description}</CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2">
          {action}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {loading ? (
          <div className="flex h-[300px] items-center justify-center text-[var(--color-neutral-08)]">
            加载中...
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
