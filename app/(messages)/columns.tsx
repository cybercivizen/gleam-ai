"use client";

import { Message } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<Message>[] = [
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "content",
    header: "Content",
  },
  {
    accessorKey: "timestamp",
    header: "Timestamp",
  },
];
