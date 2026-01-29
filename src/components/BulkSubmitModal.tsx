import { TextAttributes } from "@opentui/core";

interface BulkSubmitModalProps {
  missingDays: string[];
  hours: number;
  saving: boolean;
  progress: number;
  error: string | null;
}

const COLORS = {
  border: "#86efac",
  error: "#f87171",
};

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
}

export function BulkSubmitModal({ missingDays, hours, saving, progress, error }: BulkSubmitModalProps) {
  const totalHours = missingDays.length * hours;
  const hasMissingDays = missingDays.length > 0;

  return (
    <box
      flexDirection="column"
      padding={1}
      borderStyle="rounded"
      borderColor={COLORS.border}
    >
      <box justifyContent="center" marginBottom={1}>
        <text attributes={TextAttributes.BOLD}>Bulk Submit Hours</text>
      </box>

      {error && (
        <box justifyContent="center" marginBottom={1}>
          <text attributes={TextAttributes.BOLD}>{error}</text>
        </box>
      )}

      {hasMissingDays ? (
        <>
          <box justifyContent="center" marginBottom={1}>
            <text>{`${missingDays.length} missing days found`}</text>
          </box>

          <box justifyContent="center" marginBottom={1}>
            <text attributes={TextAttributes.DIM}>{`Will submit ${formatHours(hours)} for each (${formatHours(totalHours)} total)`}</text>
          </box>

          {saving ? (
            <box flexDirection="column" alignItems="center">
              <text>{`Submitting... ${progress}/${missingDays.length}`}</text>
              <box marginTop={1}>
                <text attributes={TextAttributes.DIM}>[Esc] Cancel</text>
              </box>
            </box>
          ) : (
            <box justifyContent="center" gap={2}>
              <text attributes={TextAttributes.DIM}>[Enter] Submit All</text>
              <text attributes={TextAttributes.DIM}>[Esc] Cancel</text>
            </box>
          )}
        </>
      ) : (
        <>
          <box justifyContent="center" marginBottom={1}>
            <text>All days have been submitted!</text>
          </box>
          <box justifyContent="center">
            <text attributes={TextAttributes.DIM}>[Esc] Close</text>
          </box>
        </>
      )}
    </box>
  );
}
