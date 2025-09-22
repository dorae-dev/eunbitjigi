"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  Users,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  LogOut,
  Settings,
  Bell,
  Eye,
  MessageCircle,
  Calendar,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  // Mock data
  const stats = {
    totalUsers: 1247,
    activeUsers: 892,
    emergencyAlerts: 3,
    avgMoodScore: 7.2,
  };

  const recentAlerts = [
    {
      id: 1,
      user: "김할머니",
      type: "우울 징후",
      severity: "high",
      time: "10분 전",
    },
    {
      id: 2,
      user: "이할아버지",
      type: "응급 호출",
      severity: "critical",
      time: "25분 전",
    },
    {
      id: 3,
      user: "박할머니",
      type: "약물 미복용",
      severity: "medium",
      time: "1시간 전",
    },
  ];

  const userList = [
    {
      id: 1,
      name: "김할머니",
      age: 78,
      status: "온라인",
      mood: "좋음",
      lastActive: "방금 전",
    },
    {
      id: 2,
      name: "이할아버지",
      age: 82,
      status: "오프라인",
      mood: "우울",
      lastActive: "2시간 전",
    },
    {
      id: 3,
      name: "박할머니",
      age: 75,
      status: "온라인",
      mood: "보통",
      lastActive: "5분 전",
    },
    {
      id: 4,
      name: "최할아버지",
      age: 80,
      status: "온라인",
      mood: "좋음",
      lastActive: "1분 전",
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-[#E74C3C] text-white";
      case "high":
        return "bg-[#F39C12] text-white";
      case "medium":
        return "bg-[#3498DB] text-white";
      default:
        return "bg-[#4CAF50] text-white";
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "좋음":
        return "bg-[#4CAF50] text-white";
      case "보통":
        return "bg-[#F39C12] text-white";
      case "우울":
        return "bg-[#E74C3C] text-white";
      default:
        return "bg-[#DDDDDD] text-[#888888]";
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EA]">
      {/* Header */}
      <header className="bg-[#A8BBA3] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#B87C4C] rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  은빛지기 관리자
                </h1>
                <p className="text-sm text-white/80">시스템 관리 대시보드</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Bell className="w-4 h-4" />
                <Badge className="ml-2 bg-[#E74C3C] text-white text-xs">
                  {stats.emergencyAlerts}
                </Badge>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Settings className="w-4 h-4" />
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-shadow bg-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#555555]">전체 사용자</p>
                  <p className="text-2xl font-bold text-[#2A2A2A]">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-[#B87C4C]" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow bg-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#555555]">활성 사용자</p>
                  <p className="text-2xl font-bold text-[#2A2A2A]">
                    {stats.activeUsers.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-[#4CAF50]" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow bg-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#555555]">응급 알림</p>
                  <p className="text-2xl font-bold text-[#E74C3C]">
                    {stats.emergencyAlerts}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-[#E74C3C]" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow bg-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#555555]">평균 기분 점수</p>
                  <p className="text-2xl font-bold text-[#2A2A2A]">
                    {stats.avgMoodScore}/10
                  </p>
                </div>
                <Heart className="w-8 h-8 text-[#F39C12]" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Management */}
            <Card className="card-shadow bg-white border-0">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-[#2A2A2A]">
                      사용자 관리
                    </CardTitle>
                    <CardDescription className="text-[#555555]">
                      등록된 사용자들의 현황을 확인하고 관리하세요
                    </CardDescription>
                  </div>
                  <Button className="btn-primary">
                    <Users className="w-4 h-4 mr-2" />
                    사용자 추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="사용자 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-focus"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="btn-secondary bg-transparent"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="btn-secondary bg-transparent"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {userList.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-[#F7F4EA] rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#B87C4C] rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[#2A2A2A]">
                            {user.name}
                          </p>
                          <p className="text-sm text-[#555555]">
                            {user.age}세 • {user.lastActive}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getMoodColor(user.mood)}>
                          {user.mood}
                        </Badge>
                        <Badge
                          variant={
                            user.status === "온라인" ? "default" : "secondary"
                          }
                        >
                          {user.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="card-shadow bg-white border-0">
              <CardHeader>
                <CardTitle className="text-[#2A2A2A] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#B87C4C]" />
                  분석 리포트
                </CardTitle>
                <CardDescription className="text-[#555555]">
                  사용자 활동 및 정서 상태 분석
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="mood" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="mood">기분 분석</TabsTrigger>
                    <TabsTrigger value="activity">활동 분석</TabsTrigger>
                    <TabsTrigger value="health">건강 지표</TabsTrigger>
                  </TabsList>
                  <TabsContent value="mood" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[#555555]">긍정적 감정</span>
                        <span className="font-medium text-[#4CAF50]">68%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#555555]">중립적 감정</span>
                        <span className="font-medium text-[#F39C12]">22%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#555555]">부정적 감정</span>
                        <span className="font-medium text-[#E74C3C]">10%</span>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="activity" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[#555555]">일일 평균 대화</span>
                        <span className="font-medium text-[#2A2A2A]">
                          12.3회
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#555555]">평균 세션 시간</span>
                        <span className="font-medium text-[#2A2A2A]">
                          8.5분
                        </span>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="health" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[#555555]">전반적 건강 점수</span>
                        <span className="font-medium text-[#4CAF50]">
                          8.2/10
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#555555]">위험군 사용자</span>
                        <span className="font-medium text-[#E74C3C]">23명</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Emergency Alerts */}
            <Card className="card-shadow bg-white border-0">
              <CardHeader>
                <CardTitle className="text-[#2A2A2A] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#E74C3C]" />
                  긴급 알림
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="p-3 bg-[#F7F4EA] rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-[#2A2A2A]">
                          {alert.user}
                        </p>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#555555] mb-2">
                        {alert.type}
                      </p>
                      <p className="text-xs text-[#888888]">{alert.time}</p>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4 btn-primary">
                  모든 알림 보기
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-shadow bg-white border-0">
              <CardHeader>
                <CardTitle className="text-[#2A2A2A]">빠른 작업</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full btn-secondary justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  상담 일정 관리
                </Button>
                <Button className="w-full btn-secondary justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  대화 기록 검토
                </Button>
                <Button className="w-full btn-secondary justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  리포트 생성
                </Button>
                <Button className="w-full btn-secondary justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  시스템 설정
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="card-shadow bg-white border-0">
              <CardHeader>
                <CardTitle className="text-[#2A2A2A]">시스템 상태</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#555555]">AI 서버</span>
                    <Badge className="bg-[#4CAF50] text-white">정상</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#555555]">데이터베이스</span>
                    <Badge className="bg-[#4CAF50] text-white">정상</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#555555]">알림 서비스</span>
                    <Badge className="bg-[#F39C12] text-white">점검중</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
