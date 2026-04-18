import type { UserProgressStatus } from "@evolith/shared";
import type { CSSProperties } from "react";

import { getStatusLabel } from "../lib/skills";

export interface StatusBadgeProps {
  status: UserProgressStatus;
}

const baseBadgeStyle: CSSProperties = {
  alignItems: "center",
  borderRadius: "999px",
  borderStyle: "solid",
  borderWidth: "1px",
  display: "inline-flex",
  fontSize: "0.78rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  minHeight: "2.2rem",
  padding: "0.45rem 0.8rem",
  textTransform: "uppercase",
};

const statusBadgeStyles = {
  locked: {
    background: "rgba(29, 36, 41, 0.08)",
    borderColor: "rgba(29, 36, 41, 0.12)",
    color: "rgba(29, 36, 41, 0.68)",
  },
  available: {
    background: "rgba(201, 111, 45, 0.14)",
    borderColor: "rgba(201, 111, 45, 0.18)",
    color: "var(--orange)",
  },
  inProgress: {
    background: "rgba(29, 140, 131, 0.14)",
    borderColor: "rgba(29, 140, 131, 0.22)",
    color: "var(--teal-deep)",
  },
  completed: {
    background: "rgba(18, 91, 87, 0.14)",
    borderColor: "rgba(18, 91, 87, 0.22)",
    color: "var(--teal-deep)",
  },
} satisfies Record<UserProgressStatus, CSSProperties>;

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span style={{ ...baseBadgeStyle, ...statusBadgeStyles[status] }}>
      {getStatusLabel(status)}
    </span>
  );
}
