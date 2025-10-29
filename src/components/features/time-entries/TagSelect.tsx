import * as React from "react";
import { XIcon } from "lucide-react";
import type { TagDTO } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TagSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  tags: TagDTO[];
  placeholder?: string;
}

export function TagSelect({ value, onChange, tags, placeholder = "Wybierz tagi" }: TagSelectProps) {
  const [selectedTags, setSelectedTags] = React.useState<string[]>(value);

  React.useEffect(() => {
    setSelectedTags(value);
  }, [value]);

  const handleAddTag = (tagId: string) => {
    if (!selectedTags.includes(tagId)) {
      const newTags = [...selectedTags, tagId];
      setSelectedTags(newTags);
      onChange(newTags);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    const newTags = selectedTags.filter((id) => id !== tagId);
    setSelectedTags(newTags);
    onChange(newTags);
  };

  const availableTags = tags.filter((tag) => !selectedTags.includes(tag.id));
  const selectedTagObjects = tags.filter((tag) => selectedTags.includes(tag.id));

  return (
    <div className="space-y-2">
      <Select onValueChange={handleAddTag} value="">
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {availableTags.length > 0 ? (
            availableTags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name}
              </SelectItem>
            ))
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">Brak dostępnych tagów</div>
          )}
        </SelectContent>
      </Select>

      {selectedTagObjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTagObjects.map((tag) => (
            <div
              key={tag.id}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-0.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <span>{tag.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemoveTag(tag.id)}
              >
                <XIcon className="h-3 w-3" />
                <span className="sr-only">Usuń {tag.name}</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
