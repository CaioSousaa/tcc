"use client";

import type { KeyboardEvent } from "react";
import { useSearch } from "@/contexts/SearchContext";

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  );
}

/** Header search: filters the boards of "Meus quadros" as the user types; Esc clears it. */
export function BoardSearch() {
  const { query, setQuery } = useSearch();

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && query !== "") {
      event.preventDefault();
      setQuery("");
    }
  }

  return (
    <div role="search" className="relative w-full max-w-[324px]">
      <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
        <SearchIcon />
      </span>
      <input
        type="search"
        aria-label="Buscar quadros"
        placeholder="Buscar quadros"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        className="h-11 w-full rounded-lg border border-line bg-surface/60 pl-10 pr-3 text-[15px] text-ink outline-none placeholder:text-muted focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}
