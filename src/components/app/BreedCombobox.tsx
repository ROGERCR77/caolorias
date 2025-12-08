import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { useData, BreedReference } from "@/contexts/DataContext";

interface BreedComboboxProps {
  value: string;
  onChange: (value: string, breedRef?: BreedReference) => void;
  disabled?: boolean;
}

export function BreedCombobox({ value, onChange, disabled }: BreedComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const { breedReferences } = useData();

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
    // Allow free text input
    onChange(newValue, undefined);
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
          {value || "Selecione ou digite a raça..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-card" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar raça..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-2 px-3 text-sm">
                <p className="text-muted-foreground mb-2">Raça não encontrada na lista.</p>
                {inputValue && (
                  <Button
                    variant="ghost"
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
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedBreed?.id === breed.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{breed.breed_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {breed.peso_min_kg}–{breed.peso_max_kg} kg • Energia {breed.energia_padrao}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}