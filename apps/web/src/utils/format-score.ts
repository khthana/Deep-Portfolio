/**
 * A score for a table cell: the number as it stands, or a dash when there is
 * none.
 *
 * The API sends `null` for a score nobody has and for a statistic there is
 * nothing to compute — an activity nobody has been marked for has no highest,
 * lowest or average mark (#28). The tables used to write `value ? value : "-"`,
 * which also turns a real 0 into a dash and so hides exactly the difference
 * that change put on the wire.
 */
export function formatScore(value: number | null | undefined): string {
  return value === null || value === undefined ? "-" : String(value);
}
