import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toLocalInputValue } from "@/lib/newsroom";

export function ScheduleDialog({
  trigger,
  initialValue,
  title = "Schedule this post",
  description = "Pick when this approved post should go out.",
  onSchedule,
}: {
  trigger: ReactNode;
  initialValue?: string | null;
  title?: string;
  description?: string;
  onSchedule: (isoDate: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() => toLocalInputValue(initialValue ?? null));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="schedule-at">Date and time</Label>
          <Input
            id="schedule-at"
            type="datetime-local"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!value}
            onClick={() => {
              onSchedule(new Date(value).toISOString());
              setOpen(false);
            }}
          >
            Save schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
