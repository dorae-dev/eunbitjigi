"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  LogOut,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { logout } from "@/lib/auth";
import { useSafeWebSocket } from "@/hooks/useSafeWebSocket";
import UserListModal from "@/components/admin/UserListModal";
import { calcAge } from "@/lib/utils";

/* -------------------- 유틸 -------------------- */

// 위험도 색상
const getSeverityColor = (type: string) => {
  switch (type) {
    case "high":
      return "bg-[#E67E22] text-white";
    case "middle":
      return "bg-[#F1C40F] text-[#2A2A2A]";
    default:
      return "bg-[#4CAF50] text-white";
  }
};

// 레이블 한국어
const levelLabel = (lvl: "high" | "middle" | "none") =>
  lvl === "high" ? "고위험" : lvl === "middle" ? "중위험" : "정상";

// 브라우저 Notification API (옵션)
function maybeNotify(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((p) => {
      if (p === "granted") new Notification(title, { body });
    });
  }
}

/* -------------------- 타입 -------------------- */

// API 응답 타입 (대시보드 리스트)
type StatusItem = {
  user_id: string;
  depression_score: number;
  sentiment_label: string;
  sentiment_score: number; // 0~1
  disease: string;
  birth: string;
  type: "high" | "middle" | "none" | string;
  name: string;
  last_updated?: string;
};

// WebSocket 알림 아이템
type AlertItem = {
  id: string;
  user_id: string;
  name: string;
  level: "high" | "middle" | "none";
  depression_score: number;
  sentiment_score: number;
  sentiment_label: string;
  disease: string;
  occurred_at: string;
  read?: boolean; // 클라 표시용
};

/* -------------------- 헬퍼 -------------------- */

function normalizeFromServer(msg: any): AlertItem {
  const d = msg?.data ?? msg;
  const id = String(msg?._id);
  return {
    id,
    user_id: String(d?.user_id ?? ""),
    name: String(d?.name ?? "이름 미상"),
    level: d?.type,
    depression_score: Number(d?.depression_score ?? 0),
    sentiment_score: Number(d?.sentiment_score ?? 0),
    sentiment_label: String(d?.sentiment_label ?? "-"),
    disease: String(d?.disease ?? "-"),
    occurred_at: String(
      msg?.time ?? d?.occurred_at ?? new Date().toISOString()
    ),
    read: false,
  };
}

function mergeSortUnique(incoming: AlertItem[], prev: AlertItem[]) {
  const map = new Map<string, AlertItem>();
  for (const p of prev) map.set(p.id, p);
  for (const n of incoming) map.set(n.id, n);
  const arr = Array.from(map.values());
  arr.sort((a, b) => +new Date(b.occurred_at) - +new Date(a.occurred_at));
  return arr.slice(0, 300); // 상한
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);

    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();

    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const seconds = d.getSeconds().toString().padStart(2, "0");

    const ampm = hours < 12 ? "오전" : "오후";
    const hour12 = hours % 12 || 12; // 0시는 12시로 표시

    return `${year}. ${month}. ${day}. ${ampm} ${hour12}:${minutes}:${seconds}`;
  } catch {
    return isoString; // 변환 실패 시 원본 반환
  }
}

export default function AdminDashboard() {
  const router = useRouter();

  /* -------------------- 알림 상태 -------------------- */
  const [notifOpen, setNotifOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const unreadCount = alerts.filter((a) => !a.read).length;

  // 고위험 모달
  const [highNow, setHighNow] = useState<AlertItem | null>(null);

  // 유저 리스트 모달 오픈 여부
  const [userListOpen, setUserListOpen] = useState(false);

  // 개별 알림 읽음 처리
  const markAlertRead = async (id: string) => {
    try {
      await api.post(`/ws/isread?id=${encodeURIComponent(id)}`);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: true } : a))
      );
    } catch (e) {
      console.error("읽음 처리 실패:", id, e);
    }
  };

  // 모두 읽음 처리
  const markAllRead = async () => {
    try {
      const unread = alerts.filter((a) => !a.read);
      await Promise.all(
        unread.map((a) =>
          api.post(`/ws/isread?id=${encodeURIComponent(a.id)}`).catch((e) => {
            console.error("읽음 처리 실패:", a.id, e);
          })
        )
      );
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    } catch (e) {
      console.error("모두 읽음 처리 실패", e);
    }
  };

  /* -------------------- 웹소켓 연결 -------------------- */
  const WS_URL = process.env.NEXT_PUBLIC_ALERTS_WS_URL || "";
  useSafeWebSocket(WS_URL, {
    onOpen: (ws) => {
      console.log("WS open:", WS_URL);
      // 서버: isread=false만 보내도록 동기화 요청
      ws.send("call_not_read");
    },
    onMessage: (ev) => {
      try {
        const payload = JSON.parse(ev.data);

        // 서버가 배열로 여러 건을 한 번에 보낼 때
        if (Array.isArray(payload)) {
          const items = payload.map(normalizeFromServer);

          setAlerts((prev) => mergeSortUnique(items, prev));

          return;
        }

        // 일반 단건
        const item = normalizeFromServer(payload);
        setAlerts((prev) => mergeSortUnique([item], prev));

        // 고위험 즉시 처리
        if (item.level === "high") {
          setHighNow(item);
          if (document.hidden) {
            const body = `우울도:${item.depression_score} 감정:${Math.round(
              item.sentiment_score * 100
            )}점 ${item.sentiment_label} / ${item.disease}`;
            maybeNotify(`고위험 - ${item.name}`, body);
          }
        }
      } catch (e) {
        console.error("WS parse error", e);
      }
    },
    onError: (ev) => console.error("WS error", ev),
    onClose: (ev) => console.log("WS close:", ev.code, ev.reason),
  });

  /* -------------------- allstatus 불러오기 -------------------- */
  const [list, setList] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get("/api/allstatus?type=all");
        if (res.status !== 200) throw new Error("allstatus fetch failed");
        const data: StatusItem[] = res.data;

        setList(
          data.map((d) => ({
            ...d,
            type: d.type,
            last_updated: d.last_updated ?? "방금 전",
          }))
        );
      } catch (e) {
        console.error(e);
        setList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [list]);

  // 모달용 전체 목록(간단 변환)
  type RiskLevel = "high" | "middle" | "none";

  const allRows = useMemo(
    () =>
      list.map((l) => ({
        user_id: l.user_id,
        name: l.name,
        age: calcAge(l.birth ?? ""),
        risk: l.type as RiskLevel,
      })),
    [list]
  );

  // 통계
  const total = list.length;
  const critical = list.filter((x) => x.type === "high").length;
  const warning = list.filter((x) => x.type === "middle").length;
  const safe = Math.max(0, total - (critical + warning));
  const stats = { total, critical, warning, safe };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // 그룹화
  const highGroup = useMemo(
    () => list.filter((x) => x.type === "high"),
    [list]
  );
  const midGroup = useMemo(
    () => list.filter((x) => x.type === "middle"),
    [list]
  );

  // 안전군 그룹/비율/라벨
  const safeGroup = useMemo(
    () => list.filter((x) => x.type !== "high" && x.type !== "middle"),
    [list]
  );

  const safeRate = useMemo(
    () => (total ? Math.round((safeGroup.length / total) * 100) : 0),
    [safeGroup.length, total]
  );

  const latestUpdatedAt = useMemo(() => {
    const ts = list
      .map((x) => new Date(x.last_updated ?? 0).getTime())
      .filter((n) => Number.isFinite(n) && n > 0);
    return ts.length ? new Date(Math.max(...ts)) : null;
  }, [list]);

  // 안전군 전용 모달 (전체 리스트 모달과 별개)
  const [safeListOpen, setSafeListOpen] = useState(false);
  const safeRows = useMemo(
    () =>
      safeGroup.map((s) => ({
        user_id: s.user_id,
        name: s.name,
        age: calcAge(s.birth ?? ""),
        risk: "none" as RiskLevel,
      })),
    [safeGroup]
  );

  // 단일 템플릿 텍스트
  const renderUnifiedDesc = (item: StatusItem) => {
    const score100 = Math.round(item.sentiment_score * 100);
    return `우울도 : ${item.depression_score}  감정점수 : ${score100}점  감정상태 : ${item.sentiment_label}  질병 : ${item.disease}`;
  };

  return (
    <div className="min-h-screen bg-[#F7F4EA]">
      {/* 헤더 */}
      <header className="bg-[#A8BBA3] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#B87C4C] rounded-full grid place-items-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  은빛지기 관리자
                </h1>
                <p className="text-sm text-white/80">관리 시스템</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setNotifOpen(true)}
                title="알림"
              >
                <Bell className="w-4 h-4" />
                <Badge className="ml-2 bg-[#E74C3C] text-white text-xs">
                  {unreadCount}
                </Badge>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 알림 팝업 */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>알림</DialogTitle>
            <DialogDescription>
              실시간 및 누락 알림 목록입니다.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-3">
              {alerts.map((n) => (
                <div key={n.id} className="p-3 bg-[#F7F4EA] rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-[#2A2A2A]">
                      {n.name}
                      {!n.read && (
                        <span className="ml-2 text-xs text-[#E74C3C]">●</span>
                      )}
                    </p>
                    <Badge className={getSeverityColor(n.level)}>
                      {levelLabel(n.level)}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#555]">
                    우울도:{n.depression_score} 감정점수:
                    {Math.round(n.sentiment_score * 100)}점 감정상태:
                    {n.sentiment_label} 질병:{n.disease}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-[#999]">
                      {new Date(n.occurred_at).toLocaleString()}
                    </p>
                    {!n.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAlertRead(n.id)}
                      >
                        읽음 처리
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-sm text-[#777]">알림이 없습니다.</p>
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              모두 읽음
            </Button>
            <Button onClick={() => setNotifOpen(false)}>닫기</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 고위험 즉시 경고 모달 */}
      <AlertDialog
        open={!!highNow}
        onOpenChange={(o) => !o && setHighNow(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#E74C3C]">
              고위험 알림
            </AlertDialogTitle>
            <AlertDialogDescription>
              {highNow
                ? `${highNow.name} | 우울도:${
                    highNow.depression_score
                  } 감정:${Math.round(highNow.sentiment_score * 100)}점 ${
                    highNow.sentiment_label
                  } / ${highNow.disease}`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end">
            <AlertDialogAction onClick={() => setHighNow(null)}>
              확인
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* 본문 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 4카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card
            className="bg-white border-0 cursor-pointer"
            onClick={() => setUserListOpen(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#777]">총 관리 대상</p>
                  <p className="text-3xl font-bold text-[#2A2A2A]">
                    {stats.total}
                  </p>
                </div>
                <Users className="w-8 h-8 text-[#8FA69A]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#777]">고위험군</p>
                  <p className="text-3xl font-bold text-[#E74C3C]">
                    {stats.critical}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-[#E74C3C]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#777]">중위험군</p>
                  <p className="text-3xl font-bold text-[#D4A017]">
                    {stats.warning}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-[#D4A017]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#777]">안전군</p>
                  <p className="text-3xl font-bold text-[#2A2A2A]">
                    {stats.safe}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-[#4CAF50]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 좌측 위험도, 우측 안전군 요약 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 좌측 2칸: 위험도 리스트 */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="risk" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[#EDE8D9]">
                <TabsTrigger value="risk">위험도별 현황</TabsTrigger>
                <TabsTrigger value="activity">최근 활동</TabsTrigger>
                <TabsTrigger value="stats">지표</TabsTrigger>
              </TabsList>

              {/* 위험도별 현황 */}
              <TabsContent value="risk" className="mt-6 space-y-6">
                {/* 고위험군(high) */}
                <Card className="bg-white border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[#E74C3C]">
                      고위험군 {highGroup.length}
                    </CardTitle>
                    <CardDescription className="text-[#555]">
                      즉각 모니터링 필요
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loading && <p className="text-[#777]">불러오는 중...</p>}
                    {!loading &&
                      highGroup.map((r) => (
                        <div
                          key={r.user_id}
                          className="p-3 bg-[#F7F4EA] rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-[#2A2A2A]">
                              {r.name}
                            </p>
                            <Badge className={getSeverityColor(r.type)}>
                              {levelLabel(r.type as any)}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#555] mt-1">
                            {renderUnifiedDesc(r)}
                          </p>
                          <p className="text-xs text-[#999] mt-1">
                            {formatDate(r.last_updated ?? "방금 전")}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/admin/user/${r.user_id}`)
                              }
                            >
                              상세 보기
                            </Button>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                {/* 중위험군 */}
                <Card className="bg-white border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[#D4A017]">
                      중위험군 {midGroup.length}
                    </CardTitle>
                    <CardDescription className="text-[#555]">
                      주의 관찰 및 정기 점검
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loading && <p className="text-[#777]">불러오는 중...</p>}
                    {!loading &&
                      midGroup.map((r) => (
                        <div
                          key={r.user_id}
                          className="p-3 bg-[#F7F4EA] rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-[#2A2A2A]">
                              {r.name}
                            </p>
                            <Badge className={getSeverityColor(r.type)}>
                              {levelLabel(r.type as any)}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#555] mt-1">
                            {renderUnifiedDesc(r)}
                          </p>
                          <p className="text-xs text-[#999] mt-1">
                            {formatDate(r.last_updated ?? "방금 전")}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/admin/user/${r.user_id}`)
                              }
                            >
                              상세 보기
                            </Button>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 탭: 최근 활동(목업) */}
              <TabsContent value="activity" className="mt-6">
                <Card className="bg-white border-0">
                  <CardHeader>
                    <CardTitle className="text-[#2A2A2A]">최근 활동</CardTitle>
                    <CardDescription className="text-[#555]">
                      시스템 알림 및 주요 변경 내역
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-[#F7F4EA] rounded-lg">
                      <p className="font-medium text-[#2A2A2A]">긴급 알림</p>
                      <p className="text-sm text-[#666]">
                        고위험 대상자 알림이 접수되었습니다.
                      </p>
                      <p className="text-xs text-[#999]">10분 전</p>
                    </div>
                    <div className="p-3 bg-[#F7F4EA] rounded-lg">
                      <p className="font-medium text-[#2A2A2A]">상담 기록</p>
                      <p className="text-sm text-[#666]">
                        중위험군 상담 일정이 등록되었습니다.
                      </p>
                      <p className="text-xs text-[#999]">1시간 전</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 탭: 지표(자리 확보) */}
              <TabsContent value="stats" className="mt-6">
                <Card className="bg-white border-0">
                  <CardHeader>
                    <CardTitle className="text-[#2A2A2A]">지표</CardTitle>
                    <CardDescription className="text-[#555]">
                      요약 지표(추후 차트 연동)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-[#F7F4EA] rounded-lg">
                        <p className="text-sm text-[#777]">일일 평균 대화</p>
                        <p className="text-2xl font-bold">—</p>
                      </div>
                      <div className="p-4 bg-[#F7F4EA] rounded-lg">
                        <p className="text-sm text-[#777]">평균 세션 시간</p>
                        <p className="text-2xl font-bold">—</p>
                      </div>
                      <div className="p-4 bg-[#F7F4EA] rounded-lg">
                        <p className="text-sm text-[#777]">긍정 감정 비율</p>
                        <p className="text-2xl font-bold">—</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* 우측 1칸: 안전군 요약 */}
          <div className="space-y-6">
            <Card className="bg-white border-0">
              <CardHeader>
                <CardTitle className="text-[#2A2A2A]">
                  안전군 {safeGroup.length} / {total}
                </CardTitle>
                <CardDescription className="text-[#555]">
                  안전군 비율과 최근 갱신 정보를 확인하세요.
                </CardDescription>
              </CardHeader>

              <CardContent className="py-6">
                {/* 진행 바 */}
                <div>
                  <div className="flex justify-between text-sm text-[#777] mb-1">
                    <span>안전 비율</span>
                    <span>{safeRate}%</span>
                  </div>
                  <div className="h-2 bg-[#F7F4EA] rounded">
                    <div
                      className="h-2 bg-[#4CAF50] rounded"
                      style={{ width: `${safeRate}%` }}
                    />
                  </div>
                </div>

                {/* 최근 갱신 */}
                <p className="text-xs text-[#999] mt-3">
                  최근 갱신:{" "}
                  {latestUpdatedAt
                    ? latestUpdatedAt.toLocaleString()
                    : "데이터 없음"}
                </p>

                {/* 버튼 */}
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="btn-secondary"
                    onClick={() => setSafeListOpen(true)}
                  >
                    안전군 보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <UserListModal
        open={userListOpen}
        onOpenChange={setUserListOpen}
        data={allRows}
      />
      <UserListModal
        open={safeListOpen}
        onOpenChange={setSafeListOpen}
        data={safeRows}
      />
    </div>
  );
}
