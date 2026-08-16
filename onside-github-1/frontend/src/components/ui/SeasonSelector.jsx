const CURRENT_SEASON_START_YEAR = 2026
const SEASON_COUNT = 6

const SEASONS = Array.from({ length: SEASON_COUNT }, (_, i) => CURRENT_SEASON_START_YEAR - i)

export function SeasonSelector({ value, onChange }) {
  return (
    <select
      value={value || SEASONS[0]}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-accent"
    >
      {SEASONS.map((year) => (
        <option key={year} value={year} className="bg-[#0A0E14]">
          {year}/{String(year + 1).slice(2)}
        </option>
      ))}
    </select>
  )
}
