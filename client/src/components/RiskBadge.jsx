// Colored label for inventory risk levels (Member 2).
export default function RiskBadge({ level = "NONE" }) {
  const colors = { HIGH: "#b42318", MEDIUM: "#b54708", LOW: "#027a48", NONE: "#667085" };
  return <span style={{ color: colors[level] || colors.NONE, fontWeight: 700 }}>{level}</span>;
}
