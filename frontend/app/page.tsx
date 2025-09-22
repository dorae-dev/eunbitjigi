"use client";

import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  const handleSignup = () => {
    router.push("/signup");
  };

  const handleAdminLogin = () => {
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#F7F4EA] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-[#B87C4C] rounded-full flex items-center justify-center">
              <Heart className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[#2A2A2A] mb-3">은빛지기</h1>
            <p className="text-[#555555] text-lg leading-relaxed">
              AI와 함께하는 따뜻한 일상 케어
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleSignup}
            className="w-full h-14 bg-[#B87C4C] hover:bg-[#A0633E] text-white text-lg font-medium rounded-xl"
          >
            회원가입
          </Button>

          <Button
            onClick={handleLogin}
            variant="ghost"
            className="w-full h-14 text-[#B87C4C] text-lg font-medium hover:bg-[#B87C4C]/10"
          >
            로그인
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <div className="flex-1 border-t border-[#DDDDDD]"></div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex justify-center items-center gap-4 text-sm text-[#888888]">
              <button className="hover:text-[#B87C4C] transition-colors">
                이용약관
              </button>
              <span>|</span>
              <button className="hover:text-[#B87C4C] transition-colors">
                개인정보 처리방침
              </button>
            </div>

            <button
              onClick={handleAdminLogin}
              className="hidden md:block text-xs text-[#CCCCCC] hover:text-[#B87C4C] transition-colors mt-4"
            >
              관리자
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
