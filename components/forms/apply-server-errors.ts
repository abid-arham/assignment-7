import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

/** Puts API/action field errors next to the matching inputs; returns true if any field matched. */
export function applyServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors: Record<string, string> | undefined,
  fields: readonly Path<T>[],
): boolean {
  let matched = false;
  for (const [field, message] of Object.entries(fieldErrors ?? {})) {
    if ((fields as readonly string[]).includes(field)) {
      setError(field as Path<T>, { type: "server", message });
      matched = true;
    }
  }
  return matched;
}
