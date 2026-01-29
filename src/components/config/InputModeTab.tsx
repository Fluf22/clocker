import { TextAttributes, type InputRenderable } from "@opentui/core";
import { memo, useCallback } from "react";
import { MODAL_COLORS } from "../../constants/modalColors.ts";
import type { InputMode } from "../../types/config.ts";

export const InputModeTab = memo(function InputModeTab({
  inputMode,
  inputLabel,
  inputPlaceholder,
  onInputChange,
  onInputSubmit,
  onInputRef,
}: {
  inputMode: InputMode;
  inputLabel: string;
  inputPlaceholder?: string;
  onInputChange?: (value: string) => void;
  onInputSubmit?: (value: string) => void;
  onInputRef?: (ref: InputRenderable | null) => void;
}) {
  const title = inputMode.startsWith("bamboohr") ? "BambooHR Setup" : "Gmail Setup";
  const hint = inputMode === "bamboohr_domain" 
    ? "Enter your company domain (e.g., 'yourcompany' from yourcompany.bamboohr.com)"
    : inputMode === "bamboohr_apikey"
    ? "Enter your BambooHR API key"
    : "Enter your Gmail App Password (16 characters)";

  const inputRef = useCallback((node: InputRenderable | null) => {
    onInputRef?.(node);
  }, [onInputRef]);

  return (
    <box flexDirection="column" gap={1} marginBottom={1}>
      <box justifyContent="center" marginBottom={1}>
        <text attributes={TextAttributes.BOLD}>{title}</text>
      </box>
      <box marginBottom={1}>
        <text attributes={TextAttributes.DIM}>{hint}</text>
      </box>
      <box flexDirection="column" gap={1} marginBottom={1}>
        <text attributes={TextAttributes.BOLD}>{inputLabel}</text>
        <box
          borderStyle="single"
          borderColor={MODAL_COLORS.active}
          height={3}
          minWidth={40}
        >
          <input
            ref={inputRef}
            placeholder={inputPlaceholder ?? "Type or paste here..."}
            focused
            onInput={onInputChange}
            onSubmit={onInputSubmit}
          />
        </box>
      </box>
    </box>
  );
});
