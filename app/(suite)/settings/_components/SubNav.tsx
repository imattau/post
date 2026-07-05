"use client";

interface SubCategory { id: string; label: string }
interface Category { id: string; icon: string; label: string; subCategories: SubCategory[] }

export function SubNav({ category, activeSub, onSelect }: { category: Category; activeSub: string; onSelect: (id: string) => void }) {
  return (
    <div className="pt-[30px] px-4">
      <h3 className="text-[18px] font-semibold text-text-near-white mb-6">{category.label}</h3>
      <div className="flex flex-col gap-[2px]">
        {category.subCategories.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onSelect(sub.id)}
            className={`w-full h-[38px] px-3 rounded-[10px] text-left text-[12px] font-medium transition-all duration-150 cursor-pointer ${
              activeSub === sub.id
                ? "bg-surface-active text-white"
                : "text-text-secondary hover:text-text-near-white"
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>
    </div>
  );
}
