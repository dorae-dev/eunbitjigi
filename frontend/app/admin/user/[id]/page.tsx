"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Phone,
  MapPin,
  User as UserIcon,
  ShieldAlert,
  ChevronLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { calcAge, formatGender, formatPhoneNumber } from "@/lib/utils";

type UserDetail = {
  user_id: string;
  name: string;
  phone?: string;
  birth?: string;
  gender?: "남성" | "여성" | string;
  address?: string;
  depression_score: number; // 우울도 (0~10)
  sentiment_label: string; // 감정 상태
  sentiment_score: number; // 0~1
  disease: string; // 질병/진단
  risk: "high" | "middle" | "none";
  diagnosed_at?: string; // 진단일 (옵션)
};

type HospitalInfo = {
  "좌표(X)": string;
  "좌표(Y)": string;
  요양기관명: string;
  종별코드명: string;
  주소: string;
  전화번호: string;
  총의사수: string;
};

type FirehouseInfo = {
  순번: string;
  시도본부: string;
  소방서명: string;
  "119안전센터명": string;
  주소: string;
  전화번호: string;
  팩스번호: string;
  decimalLatitude: string;
  decimalLongitude: string;
};

type NearbyResponse = {
  hospital: [HospitalInfo, number]; // [정보, 거리(km)]
  firehouse: [FirehouseInfo, number]; // [정보, 거리(km)]
};

const getSeverityColor = (risk: string) =>
  risk === "high"
    ? "bg-[#E74C3C] text-white"
    : risk === "middle"
    ? "bg-[#F1C40F] text-[#2A2A2A]"
    : "bg-[#4CAF50] text-white";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<UserDetail | null>(null);
  const [nearby, setNearby] = useState<NearbyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await api.get(`/api/userdetail?_id=${id}`).catch(() => null);
      if (res?.status === 200) {
        setData(res.data as UserDetail);
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    // data가 없거나 주소가 없으면 요청하지 않음
    if (!data?.address) return;

    let aborted = false;

    (async () => {
      try {
        const res = await api.get(
          `/api/nearby?address=${encodeURIComponent(data.address!)}`
        );
        if (!aborted && res?.status === 200) setNearby(res.data);
        console.log(res);
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      aborted = true; // 빠른 언마운트 시 상태 업데이트 방지
    };
    // 객체 전체가 아니라 주소 문자열만 의존 → 불필요한 재호출 방지
  }, [data?.address]);

  const emotionScore100 = useMemo(
    () => Math.round((data?.sentiment_score ?? 0) * 100),
    [data]
  );

  if (loading) return <div className="p-6">불러오는 중...</div>;
  if (!data) return <div className="p-6">데이터가 없습니다.</div>;

  return (
    <div className="min-h-screen bg-[#F7F4EA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.back()}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold text-[#2A2A2A]">개인 상세 정보</h1>
          </div>
        </div>

        {/* 상단 프로필 */}
        <Card className="bg-white border-0 mb-6">
          <CardContent className="p-6 flex flex-col md:flex-row gap-6">
            <div className="w-20 h-20 rounded-full bg-[#EDE8D9] grid place-items-center shrink-0">
              <UserIcon className="w-10 h-10 text-[#B1A891]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold text-[#2A2A2A]">
                  {data.name}
                </p>
                <Badge className={getSeverityColor(data.risk)}>
                  {data.risk === "high"
                    ? "고위험"
                    : data.risk === "middle"
                    ? "중위험"
                    : "정상"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm text-[#555]">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />{" "}
                  {formatPhoneNumber(data.phone ?? "-")}
                </div>
                <div>나이: {calcAge(data.birth ?? "-")}세</div>
                <div>성별: {formatGender(data.gender ?? "-")}</div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-[2px]" />{" "}
                  <span>{data.address ?? "-"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 지표 카드 4개 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">우울도</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold text-[#E74C3C]">
                {data.depression_score}/10
              </p>
              <div className="h-2 bg-[#F7F4EA] rounded mt-2">
                <div
                  className="h-2 bg-[#E74C3C] rounded"
                  style={{ width: `${(data.depression_score / 10) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">감정상태</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold text-[#B87C4C]">
                {data.sentiment_label}
              </p>
              <div className="mt-2 flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(emotionScore100 / 20)
                        ? "text-[#B87C4C]"
                        : "text-[#DDCBBE]"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">병명</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-base font-semibold text-[#2A2A2A]">
                {data.disease || "-"}
              </p>
              {data.diagnosed_at && (
                <p className="text-xs text-[#777] mt-1">
                  {data.diagnosed_at} 진단
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">감정점수</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold text-[#2A2A2A]">
                {emotionScore100}/100
              </p>
              <div className="h-2 bg-[#F7F4EA] rounded mt-2">
                <div
                  className="h-2 bg-[#4CAF50] rounded"
                  style={{ width: `${emotionScore100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 위험도 평가 + 주변 기관 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-[#2A2A2A] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#E74C3C]" /> 위험도 평가
              </CardTitle>
              <CardDescription>지표 기반 자동 평가</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.risk === "high" ? (
                <>
                  <div className="p-3 rounded-lg bg-[#FDECEA] text-[#C0392B]">
                    고위험군 — 즉시 관리 필요
                  </div>
                  <ul className="text-sm list-disc pl-5 text-[#555] space-y-1">
                    <li>우울도 8점 이상</li>
                    <li>감정점수 하락 추세</li>
                    <li>감정상태: 불안</li>
                  </ul>
                </>
              ) : data.risk === "middle" ? (
                <div className="p-3 rounded-lg bg-[#FFF5D6] text-[#B9770E]">
                  중위험 — 주의 관찰
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#E8F5E9] text-[#2E7D32]">
                  정상 — 안정적인 상태
                </div>
              )}
            </CardContent>
          </Card>

          {nearby && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 병원 */}
              <Card className="bg-white border-0">
                <CardHeader>
                  <CardTitle className="text-[#2A2A2A]">주변 병원</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">
                    {nearby.hospital[0]["요양기관명"]}
                  </p>
                  <p className="text-sm text-[#555]">
                    {nearby.hospital[0]["종별코드명"]}
                  </p>
                  <p className="text-sm text-[#555]">
                    {nearby.hospital[0]["주소"]}
                  </p>
                  <p className="text-sm text-[#555]">
                    📞 {nearby.hospital[0]["전화번호"]}
                  </p>
                  <p className="text-xs text-[#999]">
                    거리: {nearby.hospital[1].toFixed(2)} km
                  </p>
                </CardContent>
              </Card>

              {/* 소방서 */}
              <Card className="bg-white border-0">
                <CardHeader>
                  <CardTitle className="text-[#2A2A2A]">주변 소방서</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">
                    {nearby.firehouse[0].소방서명}
                  </p>
                  <p className="text-sm text-[#555]">
                    {nearby.firehouse[0]["119안전센터명"]}
                  </p>
                  <p className="text-sm text-[#555]">
                    {nearby.firehouse[0].주소}
                  </p>
                  <p className="text-sm text-[#555]">
                    📞 {nearby.firehouse[0].전화번호}
                  </p>
                  <p className="text-xs text-[#999]">
                    거리: {nearby.firehouse[1].toFixed(2)} km
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
