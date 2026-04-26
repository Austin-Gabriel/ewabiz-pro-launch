import { useState } from "react";
import { StepShell } from "../step-shell";
import { BigInput, FieldLabel } from "../inputs";
import { useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { useOnboarding, type ServiceMenuItem } from "@/onboarding/onboarding-context";
import type { StepProps } from "../step-router";

export function Step12Menu({ onNext }: StepProps) {
  const { data, patch } = useOnboarding();
  const [items, setItems] = useState<ServiceMenuItem[]>(data.menu ?? []);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");

  const valid = name.trim().length > 1 && Number(duration) > 0 && Number(price) > 0;

  const add = () => {
    if (!valid) return;
    const item: ServiceMenuItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      durationMin: Number(duration),
      priceUsd: Number(price),
      description: desc.trim() || undefined,
    };
    const next = [...items, item];
    setItems(next);
    patch({ menu: next });
    setName(""); setDuration(""); setPrice(""); setDesc("");
  };

  const remove = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    patch({ menu: next });
  };

  const submit = () => { patch({ menu: items }); onNext(); };

  return (
    <StepShell
      step={8}
      title={items.length === 0 ? "Add your first service." : "Your service menu."}
      subtitle="Name it like clients would search for it. You can add more later."
      onContinue={submit}
      canContinue={items.length > 0}
      ctaLabel={items.length > 0 ? "Continue" : "Add at least one"}
    >
      <MenuBody
        items={items}
        remove={remove}
        name={name} setName={setName}
        duration={duration} setDuration={setDuration}
        price={price} setPrice={setPrice}
        desc={desc} setDesc={setDesc}
        valid={valid}
        add={add}
      />
    </StepShell>
  );
}

function MenuBody({
  items, remove,
  name, setName, duration, setDuration, price, setPrice, desc, setDesc,
  valid, add,
}: {
  items: ServiceMenuItem[];
  remove: (id: string) => void;
  name: string; setName: (v: string) => void;
  duration: string; setDuration: (v: string) => void;
  price: string; setPrice: (v: string) => void;
  desc: string; setDesc: (v: string) => void;
  valid: boolean;
  add: () => void;
}) {
  const { text, borderCol } = useAuthTheme();
  return (
    <>
      {items.length > 0 ? (
        <div className="mb-6 flex flex-col gap-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ border: `1px solid ${borderCol}` }}
            >
              <div className="flex-1">
                <div style={{ fontFamily: SANS_STACK, fontSize: 14, fontWeight: 500, color: text }}>{it.name}</div>
                <div style={{ fontFamily: SANS_STACK, fontSize: 11.5, color: text, opacity: 0.55, marginTop: 2 }}>
                  {it.durationMin} min
                </div>
                <div style={{ fontFamily: SANS_STACK, fontSize: 11.5, color: text, opacity: 0.55, marginTop: 1, fontVariantNumeric: "tabular-nums" }}>
                  ${it.priceUsd}
                </div>
              </div>
              <button
                type="button" onClick={() => remove(it.id)}
                style={{ color: text, opacity: 0.4, fontSize: 18 }}
                aria-label="Remove"
              >×</button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-5 rounded-2xl p-4" style={{ border: `1px dashed ${borderCol}` }}>
        <FieldLabel>{items.length === 0 ? "New service" : "Add another"}</FieldLabel>
        <BigInput placeholder="Signature fade" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex gap-3">
          <div className="flex-1">
            <BigInput placeholder="45" type="number" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} label="Minutes" />
          </div>
          <div className="flex-1">
            <BigInput placeholder="65" type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} label="Price (USD)" />
          </div>
        </div>
        <BigInput placeholder="Short description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <button
          type="button"
          onClick={add}
          disabled={!valid}
          className="self-start transition-opacity disabled:opacity-40"
          style={{
            padding: "10px 16px", borderRadius: 9999,
            border: `1px solid #FF823F`,
            color: "#FF823F",
            fontFamily: SANS_STACK, fontSize: 12.5, fontWeight: 600,
            backgroundColor: "rgba(255,130,63,0.08)",
          }}
        >
          + Add to menu
        </button>
      </div>
    </>
  );
}
