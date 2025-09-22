"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { login } from "@/lib/auth";
import { Heart, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(formData.name, formData.password);
      router.push("/dashboard");
    } catch (err: any) {
      setError("로그인 실패. 아이디/비밀번호를 확인하세요.");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#F7F4EA] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="text-[#B87C4C] hover:bg-[#B87C4C]/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#B87C4C] rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#2A2A2A]">은빛지기</h1>
          </div>
        </div>

        <Card className="shadow-[0px_4px_12px_rgba(0,0,0,0.1)] bg-white border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-[#2A2A2A]">로그인</CardTitle>
            <CardDescription className="text-[#555555]">
              계정에 로그인하여 서비스를 이용하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#2A2A2A]">
                  이름
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="h-12 border-[#DDDDDD] focus:border-[#B87C4C]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#2A2A2A]">
                  비밀번호
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="h-12 border-[#DDDDDD] focus:border-[#B87C4C]"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[#555555]">
                  <input type="checkbox" className="rounded border-[#DDDDDD]" />
                  로그인 상태 유지
                </label>
                <button
                  type="button"
                  className="text-[#B87C4C] hover:underline"
                >
                  비밀번호 찾기
                </button>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                className="w-full h-12 bg-[#B87C4C] hover:bg-[#A0633E] text-white text-base font-medium rounded-lg mt-6"
              >
                로그인
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#555555]">
                계정이 없으신가요?{" "}
                <button
                  onClick={() => router.push("/signup")}
                  className="text-[#B87C4C] hover:underline font-medium"
                >
                  회원가입
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
