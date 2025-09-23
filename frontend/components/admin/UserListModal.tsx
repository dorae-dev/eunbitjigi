"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

type Row = {
  user_id: string;
  name: string;
  age?: number;
  risk: "high" | "middle" | "none";
};

const color = (r: Row["risk"]) =>
  r === "high"
    ? "bg-[#E74C3C] text-white"
    : r === "middle"
    ? "bg-[#F1C40F] text-[#2A2A2A]"
    : "bg-[#4CAF50] text-white";

export default function UserListModal({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: Row[];
}) {
  const [q, setQ] = useState("");
  const router = useRouter();

  const filtered = useMemo(() => {
    const v = q.trim();
    if (!v) return data;
    return data.filter((d) =>
      [d.name, d.user_id, String(d.age ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(v.toLowerCase())
    );
  }, [q, data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>전체 관리 대상</DialogTitle>
          <DialogDescription className="sr-only">
            전체 사용자 목록과 검색창이 포함된 모달입니다. 이름, ID, 나이로
            검색해 사용자를 선택할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="이름/ID/나이 검색…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <ScrollArea className="max-h-[60vh] pr-2 mt-3">
          <div className="space-y-2">
            {filtered.map((u) => (
              <div
                key={u.user_id}
                className="p-3 bg-[#F7F4EA] rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-[#2A2A2A]">
                    {u.name}{" "}
                    <span className="text-[#777] text-sm">
                      ({u.age ?? "-"}세)
                    </span>
                  </p>
                  <p className="text-xs text-[#999]">ID: {u.user_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={color(u.risk)}>
                    {u.risk === "high"
                      ? "고위험"
                      : u.risk === "middle"
                      ? "중위험"
                      : "정상"}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      router.push(`/admin/user/${u.user_id}`);
                    }}
                  >
                    상세 보기
                  </Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-[#777]">검색 결과가 없습니다.</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
