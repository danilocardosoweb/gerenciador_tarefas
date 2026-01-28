import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import { searchAddress } from "@/services/nominatim";
import { SearchResult } from "@/types/route";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSelectLocation: (lat: number, lon: number, address: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSelectLocation, placeholder = "Buscar endereço..." }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.length >= 3) {
        setIsLoading(true);
        const searchResults = await searchAddress(query);
        setResults(searchResults);
        setIsOpen(true);
        setIsLoading(false);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    onSelectLocation(lat, lon, result.display_name);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-4"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border bg-card shadow-lg">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
          ) : results.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleSelect(result)}
                  className="flex w-full items-start gap-3 border-b p-3 text-left transition-colors hover:bg-accent last:border-b-0"
                >
                  <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">{result.display_name}</p>
                    {result.address && (
                      <p className="truncate text-xs text-muted-foreground">
                        {[result.address.city, result.address.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}
