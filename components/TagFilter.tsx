"use client";

interface TagFilterProps {
  tags: string[];
  activeTag: string;
  onTagChange: (tag: string) => void;
  labelAll?: string;
}

export default function TagFilter({ 
  tags, 
  activeTag, 
  onTagChange, 
  labelAll = "All Tags" 
}: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <select
      className="bg-surface border border-border-subtle rounded-lg px-4 py-2 text-sm text-text-secondary focus:outline-none focus:border-border-strong transition-colors cursor-pointer min-w-32"
      value={activeTag}
      onChange={(e) => onTagChange(e.target.value)}
    >
      <option value="">{labelAll}</option>
      {tags.map((tag) => (
        <option key={tag} value={tag}>
          #{tag}
        </option>
      ))}
    </select>
  );
}
