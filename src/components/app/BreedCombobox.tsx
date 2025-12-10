import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useData, BreedReference } from "@/contexts/DataContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface BreedComboboxProps {
  value: string;
  onChange: (value: string, breedRef?: BreedReference) => void;
  disabled?: boolean;
}

export function BreedCombobox({ value, onChange, disabled }: BreedComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const { breedReferences } = useData();
  const isMobile = useIsMobile();

  const filteredBreeds = useMemo(() => {
    if (!inputValue.trim()) return breedReferences;
    const query = inputValue.toLowerCase();
    return breedReferences.filter((breed) =>
      breed.breed_name.toLowerCase().includes(query)
    );
  }, [breedReferences, inputValue]);

  const selectedBreed = breedReferences.find(
    (b) => b.breed_name.toLowerCase() === value.toLowerCase()
  );

  const handleSelect = (breedName: string) => {
    const breedRef = breedReferences.find(
      (b) => b.breed_name.toLowerCase() === breedName.toLowerCase()
    );
    onChange(breedName, breedRef);
    setInputValue(breedName);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue, undefined);
  };

  const CommandContent = (
    <Command shouldFilter={false} className="bg-transparent">
      <CommandInput
        placeholder="Buscar raça..."
        value={inputValue}
        onValueChange={handleInputChange}
      />
      <CommandList className="max-h-[50dvh]">
        <CommandEmpty>
          <div className="py-4 px-3 text-sm">
            <p className="text-muted-foreground mb-3">Raça não encontrada na lista.</p>
            {inputValue && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  onChange(inputValue, undefined);
                  setOpen(false);
                }}
              >
                Usar "{inputValue}"
              </Button>
            )}
          </div>
        </CommandEmpty>
        <CommandGroup>
          {filteredBreeds.map((breed) => (
            <CommandItem
              key={breed.id}
              value={breed.breed_name}
              onSelect={() => handleSelect(breed.breed_name)}
              className="cursor-pointer py-3"
            >
              <Check
                className={cn(
                  "mr-3 h-5 w-5",
                  selectedBreed?.id === breed.id ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex flex-col">
                <span className="font-medium">{breed.breed_name}</span>
                <span className="text-xs text-muted-foreground">
                  {breed.peso_min_kg}–{breed.peso_max_kg} kg • Energia {breed.energia_padrao}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  // Always use drawer on mobile for better iOS experience
  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-12 text-base"
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
          {value || "Selecione ou digite a raça..."}
          <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
        </Button>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[80dvh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle>Selecionar Raça</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
              {CommandContent}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: use popover
  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between font-normal"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {value || "Selecione ou digite a raça..."}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div 
            className="absolute mt-2 w-[300px] rounded-2xl border bg-popover shadow-xl"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {CommandContent}
          </div>
        </div>
      )}
    </>
  );
}
