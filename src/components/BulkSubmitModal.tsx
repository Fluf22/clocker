import { TextAttributes } from "@opentui/core";
import { formatHoursAsDuration } from "../utils/calendar.ts";
import { ErrorDisplay, FutureMonthWarning } from "./config/index.ts";
import { KeyHint, KeyHintBar } from "./KeyHint.tsx";

interface BulkSubmitModalProps {
  missingDays: string[];
  hours: number;
  saving: boolean;
  progress: number;
  error: string | null;
  isFutureMonth: boolean;
}

const COLORS = {
  border: "#86efac",
  error: "#f87171",
  warning: "#fbbf24",
};

export function BulkSubmitModal({ missingDays, hours, saving, progress, error, isFutureMonth }: BulkSubmitModalProps) {
  const totalHours = missingDays.length * hours;
  const hasMissingDays = missingDays.length > 0;

  return (
    <box
      flexDirection="column"
      padding={1}
      borderStyle="rounded"
      borderColor={isFutureMonth ? COLORS.warning : COLORS.border}
    >
      <box justifyContent="center" marginBottom={1}>
        <text attributes={TextAttributes.BOLD}>Bulk Submit Hours</text>
      </box>

      {error && <ErrorDisplay error={error} />}

      {isFutureMonth ? (
        <FutureMonthWarning action="submission" />
      ) : hasMissingDays ? (
        <>
          <box justifyContent="center" marginBottom={1}>
            <text>{`${missingDays.length} missing days found`}</text>
          </box>

          <box justifyContent="center" marginBottom={1}>
            <text attributes={TextAttributes.DIM}>{`Will submit ${formatHoursAsDuration(hours)} for each (${formatHoursAsDuration(totalHours)} total)`}</text>
          </box>

           {saving ? (
             <box flexDirection="column" alignItems="center">
               <text>{`Submitting... ${progress}/${missingDays.length}`}</text>
               <box marginTop={1}>
                 <KeyHint keyName="Esc" action="Cancel" />
               </box>
             </box>
           ) : (
             <KeyHintBar>
               <KeyHint keyName="Enter" action="Submit All" />
               <KeyHint keyName="Esc" action="Cancel" />
             </KeyHintBar>
           )}
        </>
       ) : (
         <>
           <box justifyContent="center" marginBottom={1}>
             <text>All days have been submitted!</text>
           </box>
           <box justifyContent="center">
             <KeyHint keyName="Esc" action="Close" />
           </box>
         </>
       )}
    </box>
  );
}
