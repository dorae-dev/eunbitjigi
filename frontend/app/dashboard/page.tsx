"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  MessageCircle,
  Calendar,
  TrendingUp,
  Bell,
  User,
  LogOut,
  Phone,
  Clock,
  Activity,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { api } from "@/lib/api";

export default function UserDashboard() {
  const [currentMood, setCurrentMood] = useState("좋음");
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  const handleStartChat = () => {
    router.push("/chat");
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/api/userinfo");
        setUserName(data.name);
      } catch (e: any) {
        console.error(e);
        setUserName("사용자");
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="h-screen bg-[#F7F4EA] flex flex-col">
      <header className="bg-[#A8BBA3] shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#B87C4C] rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">은빛지기</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Bell className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <User className="w-4 h-4" />
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

      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-full">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#2A2A2A] mb-2">
              안녕하세요, {userName ?? "로딩중..."}님
            </h2>
            <p className="text-[#555555]">오늘도 건강한 하루 보내세요</p>
          </div>

          <Tabs defaultValue="home" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="home" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />홈
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                건강
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                일정
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                소통
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="home" className="h-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-full overflow-y-auto">
                  <Card className="shadow-[0px_2px_6px_rgba(0,0,0,0.1)] bg-white border-0 h-fit">
                    <CardHeader>
                      <CardTitle className="text-[#2A2A2A]">
                        빠른 실행
                      </CardTitle>
                      <CardDescription className="text-[#555555]">
                        자주 사용하는 기능들을 바로 실행하세요
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4">
                        <Button
                          className="h-16 bg-[#B87C4C] hover:bg-[#A0633E] text-white flex-col gap-2"
                          onClick={handleStartChat}
                        >
                          <MessageCircle className="w-6 h-6" />
                          AI 상담 시작하기
                        </Button>
                        <Button className="h-16 bg-[#F7F4EA] text-[#B87C4C] border border-[#B87C4C] hover:bg-[#EBD9D1] flex-col gap-2">
                          <Phone className="w-6 h-6" />
                          응급 상황 신고
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-[0px_2px_6px_rgba(0,0,0,0.1)] bg-white border-0 h-fit">
                    <CardHeader>
                      <CardTitle className="text-[#2A2A2A] flex items-center gap-2">
                        <Heart className="w-5 h-5 text-[#B87C4C]" />
                        오늘의 기분
                      </CardTitle>
                      <CardDescription className="text-[#555555]">
                        현재 기분 상태를 알려주세요
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[#2A2A2A] font-medium">
                          현재 기분:
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-[#4CAF50] text-white"
                        >
                          {currentMood}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {["매우 좋음", "좋음", "보통", "우울함"].map((mood) => (
                          <Button
                            key={mood}
                            variant={
                              currentMood === mood ? "default" : "outline"
                            }
                            size="sm"
                            className={
                              currentMood === mood
                                ? "bg-[#B87C4C] text-white hover:bg-[#A0633E]"
                                : "bg-[#F7F4EA] text-[#B87C4C] border-[#B87C4C] hover:bg-[#EBD9D1]"
                            }
                            onClick={() => setCurrentMood(mood)}
                          >
                            {mood}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="health" className="h-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-full overflow-y-auto">
                  <Card className="shadow-[0px_2px_6px_rgba(0,0,0,0.1)] bg-white border-0 h-fit">
                    <CardHeader>
                      <CardTitle className="text-[#2A2A2A] flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#B87C4C]" />
                        건강 상태
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-[#555555]">전반적 상태</span>
                          <span className="text-[#2A2A2A] font-medium">
                            85%
                          </span>
                        </div>
                        <Progress value={85} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-[#555555]">정서 안정성</span>
                          <span className="text-[#2A2A2A] font-medium">
                            78%
                          </span>
                        </div>
                        <Progress value={78} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-[#555555]">사회적 연결</span>
                          <span className="text-[#2A2A2A] font-medium">
                            92%
                          </span>
                        </div>
                        <Progress value={92} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-[0px_2px_6px_rgba(0,0,0,0.1)] bg-white border-0 h-fit">
                    <CardHeader>
                      <CardTitle className="text-[#2A2A2A]">
                        건강 기록
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[#555555]">혈압</span>
                          <span className="text-[#2A2A2A] font-medium">
                            120/80
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#555555]">심박수</span>
                          <span className="text-[#2A2A2A] font-medium">
                            72 bpm
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#555555]">체온</span>
                          <span className="text-[#2A2A2A] font-medium">
                            36.5°C
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="h-full">
                <div className="max-h-full overflow-y-auto">
                  <Card className="shadow-[0px_2px_6px_rgba(0,0,0,0.1)] bg-white border-0 h-fit">
                    <CardHeader>
                      <CardTitle className="text-[#2A2A2A] flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#B87C4C]" />
                        오늘 일정
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-[#F7F4EA] rounded-lg">
                          <div className="w-3 h-3 bg-[#4CAF50] rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-medium text-[#2A2A2A]">
                              약 복용
                            </p>
                            <p className="text-sm text-[#555555]">오후 1:00</p>
                          </div>
                          <Badge variant="outline">완료</Badge>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-[#F7F4EA] rounded-lg">
                          <div className="w-3 h-3 bg-[#F39C12] rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-medium text-[#2A2A2A]">산책</p>
                            <p className="text-sm text-[#555555]">오후 4:00</p>
                          </div>
                          <Badge variant="outline">예정</Badge>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-[#F7F4EA] rounded-lg">
                          <div className="w-3 h-3 bg-[#3498DB] rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-medium text-[#2A2A2A]">
                              저녁 식사
                            </p>
                            <p className="text-sm text-[#555555]">오후 6:30</p>
                          </div>
                          <Badge variant="outline">예정</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="social" className="h-full">
                <div className="max-h-full overflow-y-auto">
                  <Card className="shadow-[0px_2px_6px_rgba(0,0,0,0.1)] bg-white border-0 h-fit">
                    <CardHeader>
                      <CardTitle className="text-[#2A2A2A]">
                        최근 활동
                      </CardTitle>
                      <CardDescription className="text-[#555555]">
                        최근 상담 및 활동 내역입니다
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 bg-[#F7F4EA] rounded-lg">
                          <MessageCircle className="w-5 h-5 text-[#B87C4C]" />
                          <div className="flex-1">
                            <p className="text-[#2A2A2A] font-medium">
                              AI 상담
                            </p>
                            <p className="text-sm text-[#555555]">
                              오늘 오전 10:30
                            </p>
                          </div>
                          <Badge variant="outline">완료</Badge>
                        </div>
                        <div className="flex items-center gap-4 p-3 bg-[#F7F4EA] rounded-lg">
                          <Calendar className="w-5 h-5 text-[#B87C4C]" />
                          <div className="flex-1">
                            <p className="text-[#2A2A2A] font-medium">
                              복지사 상담 예약
                            </p>
                            <p className="text-sm text-[#555555]">
                              내일 오후 2:00
                            </p>
                          </div>
                          <Badge variant="outline">예정</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
