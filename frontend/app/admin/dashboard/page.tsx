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

// 위험도 색상
const getSeverityColor = (type: string) => {
  switch (type) {
    case "critical":
      return "bg-[#E74C3C] text-white";
    case "high":
      return "bg-[#E67E22] text-white";
    case "medium":
      return "bg-[#F1C40F] text-[#2A2A2A]";
    default:
      return "bg-[#4CAF50] text-white";
  }
};

// API 응답 타입
type StatusItem = {
  user_id: string;
  depression_score: number; // 우울도(정수)
  sentiment_label: string; // 감정 상태 라벨 (예: 걱정스러운(불안한))
  sentiment_score: number; // 0~1 실수 → 0~100점으로 변환 표시
  disease: string; // 질병
  type: "critical" | "high" | "medium" | "low" | string;
  name: string;
  time?: string; // (옵션) 표시용 최근 갱신 시간
};

export default function AdminDashboard() {
  const router = useRouter();

  // 알림 팝업(목업) -------------------------
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    {
      id: number;
      title: string;
      detail: string;
      level: "critical" | "high" | "medium";
      time: string;
    }[]
  >([
    {
      id: 101,
      title: "고위험 감지",
      detail: "오준식(??) 우울도 8, 즉시 확인 필요",
      level: "critical",
      time: "10분 전",
    },
    {
      id: 102,
      title: "응급 알림",
      detail: "고위험 지표 증가 대상 1건",
      level: "high",
      time: "35분 전",
    },
    {
      id: 103,
      title: "주의 알림",
      detail: "중위험 지표 변화 대상 2건",
      level: "medium",
      time: "1시간 전",
    },
  ]);

  // 대시보드 데이터 -------------------------
  const [list, setList] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API 연동: /api/allstatus (동일 출처 프록시 가정)
    const fetchAll = async () => {
      try {
        const res = await fetch("/api/allstatus", { cache: "no-store" });
        if (!res.ok) throw new Error("allstatus fetch failed");
        const data: StatusItem[] = await res.json();
        setList(
          data.map((d) => ({
            ...d,
            time: d.time ?? "방금 전",
          }))
        );
      } catch {
        // --- 목업 대체 ---
        setList([
          {
            user_id: "68cfe324c0034f6d28791d47",
            depression_score: 7,
            sentiment_label: "걱정스러운(불안한)",
            sentiment_score: 0.626, // → 63점
            disease: "복통",
            type: "high",
            name: "오준식",
            time: "24분 전",
          },
          {
            user_id: "u-2",
            depression_score: 9,
            sentiment_label: "불안한",
            sentiment_score: 0.81,
            disease: "고혈압",
            type: "critical",
            name: "김영희",
            time: "44분 전",
          },
          {
            user_id: "u-3",
            depression_score: 5,
            sentiment_label: "다소 우울",
            sentiment_score: 0.52,
            disease: "소화불량",
            type: "medium",
            name: "정만수",
            time: "1시간 전",
          },
          {
            user_id: "u-4",
            depression_score: 3,
            sentiment_label: "안정적",
            sentiment_score: 0.22,
            disease: "없음",
            type: "low",
            name: "이순자",
            time: "3시간 전",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // 통계 집계 (요청 UI의 4개 카드)
  const total = list.length;
  const critical = list.filter(
    (x) => x.type === "critical" || x.type === "high"
  ).length;
  const warning = list.filter((x) => x.type === "medium").length;
  const safe = Math.max(0, total - (critical + warning));

  const stats = { total, critical, warning, safe };

  const handleLogout = () => router.push("/");

  // 위험도 그룹화
  const highGroup = useMemo(
    () => list.filter((x) => x.type === "critical" || x.type === "high"),
    [list]
  );
  const midGroup = useMemo(
    () => list.filter((x) => x.type === "medium"),
    [list]
  );

  // 공통 템플릿 텍스트
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
              >
                <Bell className="w-4 h-4" />
                <Badge className="ml-2 bg-[#E74C3C] text-white text-xs">
                  {notifications.length}
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

      {/* 알림 팝업(목업) */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>알림</DialogTitle>
            <DialogDescription>
              대시보드 미접속 시 수신된 위험 알림입니다. (목업, 추후 API 연동)
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className="p-3 bg-[#F7F4EA] rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-[#2A2A2A]">{n.title}</p>
                    <Badge className={getSeverityColor(n.level)}>
                      {n.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#555]">{n.detail}</p>
                  <p className="text-xs text-[#999] mt-1">{n.time}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNotifications([])}>
              모두 비우기
            </Button>
            <Button onClick={() => setNotifOpen(false)}>닫기</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 본문 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 4카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-0">
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
                {/* 고위험군(critical/high) */}
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
                              {r.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#555] mt-1">
                            {renderUnifiedDesc(r)}
                          </p>
                          <p className="text-xs text-[#999] mt-1">{r.time}</p>
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
                              {r.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#555] mt-1">
                            {renderUnifiedDesc(r)}
                          </p>
                          <p className="text-xs text-[#999] mt-1">{r.time}</p>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 탭: 최근 활동(간단 목업) */}
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
                  안전군 {stats.safe}
                </CardTitle>
                <CardDescription className="text-[#555]">
                  대부분의 대상자가 안정적 상태를 유지하고 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid place-items-center py-8">
                <CheckCircle2 className="w-12 h-12 text-[#4CAF50]" />
                <p className="text-sm text-[#777] mt-2">시스템 정상 작동</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
