export function CompetitionSelector({ competitions, value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-accent"
    >
      {competitions.map((comp) => (
        <option key={comp.code} value={comp.code} className="bg-[#0A0E14]">
          {comp.name}
        </option>
      ))}
    </select>
  )
}
