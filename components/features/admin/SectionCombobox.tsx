"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Section {
  id: string;
  sectionLabel: string;
  currentEnrollments: number;
  tutor: {
    id: string;
    user: {
      name: string;
    };
    availability: {
      id: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[];
  };
  template: {
    name: string;
    maxStudentsPerSection: number;
  };
}

interface SectionComboboxProps {
  sections: Section[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SectionCombobox({
  sections,
  value,
  onValueChange,
  placeholder = "Pilih section...",
  disabled = false,
}: SectionComboboxProps) {
  const [open, setOpen] = React.useState(false);

  // Group sections by template name
  const groupedSections = React.useMemo(() => {
    const groups: Record<string, Section[]> = {};

    sections.forEach((section) => {
      const templateName = section.template.name;
      if (!groups[templateName]) {
        groups[templateName] = [];
      }
      groups[templateName].push(section);
    });

    // Sort groups alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [sections]);

  // Find selected section
  const selectedSection = sections.find((s) => s.id === value);

  // Format display text
  const getDisplayText = () => {
    if (!selectedSection) return placeholder;
    return `${selectedSection.template.name} - Section ${selectedSection.sectionLabel}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari section..." />
          <CommandList>
            <CommandEmpty>
              <div className="py-4 text-center text-sm text-muted-foreground">
                Section tidak ditemukan
              </div>
            </CommandEmpty>

            {groupedSections.map(([templateName, templateSections]) => (
              <CommandGroup key={templateName} heading={templateName}>
                {templateSections.map((section) => (
                  <CommandItem
                    key={section.id}
                    value={`${templateName} ${section.sectionLabel} ${section.tutor.user.name}`}
                    onSelect={() => {
                      onValueChange(section.id);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === section.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div>
                          <div className="font-medium">
                            Section {section.sectionLabel}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Tutor: {section.tutor.user.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>
                          {section.currentEnrollments}/
                          {section.template.maxStudentsPerSection}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
