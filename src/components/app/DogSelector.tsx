import { useData } from "@/contexts/DataContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dog } from "lucide-react";

interface DogSelectorProps {
  className?: string;
}

export function DogSelector({ className }: DogSelectorProps) {
  const { dogs, selectedDogId, setSelectedDogId } = useData();

  if (dogs.length === 0) {
    return null;
  }

  return (
    <Select value={selectedDogId || ""} onValueChange={setSelectedDogId}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <Dog className="w-4 h-4 text-primary" />
          <SelectValue placeholder="Selecionar cão" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-card">
        {dogs.map((dog) => (
          <SelectItem key={dog.id} value={dog.id}>
            {dog.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
