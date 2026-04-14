import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Download, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

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
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            {info && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">{info}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2">
          {action}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
