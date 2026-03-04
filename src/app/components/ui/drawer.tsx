import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "./basic";
import { motion, AnimatePresence } from "motion/react";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  width?: string; // e.g. "max-w-2xl"
}

export function Drawer({ open, onOpenChange, children, title, description, width = "max-w-3xl" }: DrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild>
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className={cn(
                  "fixed inset-y-0 right-0 z-50 h-full w-full border-l bg-white shadow-2xl focus:outline-none flex flex-col",
                  width
                )}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                  <div>
                    <DialogPrimitive.Title className="text-lg font-semibold text-slate-900">
                      {title}
                    </DialogPrimitive.Title>
                    {description && (
                      <DialogPrimitive.Description className="text-sm text-slate-500 mt-1">
                        {description}
                      </DialogPrimitive.Description>
                    )}
                  </div>
                  <DialogPrimitive.Close className="rounded-full p-2 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <X className="h-5 w-5 text-slate-500" />
                    <span className="sr-only">Close</span>
                  </DialogPrimitive.Close>
                </div>
                
                <div className="flex-1 overflow-y-auto p-0">
                  {children}
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
