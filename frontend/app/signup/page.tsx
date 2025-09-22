"use client";

import type React from "react";

import { useEffect, useState } from "react";
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
import { Heart, ArrowLeft, Venus, Mars } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    phone: "",
    birth: "",
    address: "",
    gender: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  const validatePhone = (phone: string) => {
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  const validatePasswords = (password: string, confirmPassword: string) => {
    return password === confirmPassword && password.length >= 8;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^\d]/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7)
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(
      7,
      11
    )}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setServerError(""); // 이전 에러 초기화
    setPasswordError(""); // 비밀번호 에러 초기화
    setPhoneError(""); // 전화번호 에러 초기화

    if (!validatePhone(formData.phone)) {
      setPhoneError("전화번호는 010-1234-5678 형태로 입력해주세요");
      return;
    }

    if (!validatePasswords(formData.password, formData.confirmPassword)) {
      setPasswordError(
        "비밀번호는 최소 8자 이상이어야 하며, 두 비밀번호가 일치해야 합니다"
      );
      return;
    }

    try {
      setSubmitting(true);
      setServerError("");

      const normalizedPhone = formData.phone.replace(/[^\d]/g, "");

      const payload = {
        name: formData.name.trim(),
        password: formData.password.trim(),
        address: formData.address.trim(),
        gender: formData.gender.trim(),
        phonenumber: normalizedPhone.trim(),
        birth: formData.birth.trim(),
      };

      try {
        const { data } = await api.post("/register", payload, {
          headers: { "Content-Type": "application/json" },
        });
        router.push("/login");
      } catch (err: any) {
        if (err.response?.status === 422) {
          // FastAPI가 내려주는 validation 에러는 보통 detail 배열로 내려옴
          const details = err.response.data?.detail;
          if (Array.isArray(details)) {
            // detail에 있는 첫 번째 메시지를 사용자에게 보여주기
            setServerError(details[0]?.msg || "입력값이 올바르지 않습니다.");
          } else {
            setServerError("입력값이 올바르지 않습니다.");
          }
        } else {
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            "회원가입 중 오류가 발생했습니다.";
          setServerError(msg);
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "회원가입 중 오류가 발생했습니다.";
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "phone") {
      const formatted = formatPhone(value);
      setFormData((prev) => ({ ...prev, phone: formatted }));
      if (phoneError && validatePhone(formatted)) {
        setPhoneError("");
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  useEffect(() => {
    if (formData.password && formData.confirmPassword) {
      if (!validatePasswords(formData.password, formData.confirmPassword)) {
        setPasswordError(
          "비밀번호는 최소 8자 이상이어야 하며, 두 값이 일치해야 합니다."
        );
      } else {
        setPasswordError("");
      }
    }
  }, [formData.password, formData.confirmPassword]);

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
            <CardTitle className="text-2xl text-[#2A2A2A]">회원가입</CardTitle>
            <CardDescription className="text-[#555555]">
              은빛지기와 함께 건강한 일상을 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {serverError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                  {serverError}
                </p>
              )}
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
                <Label htmlFor="phone" className="text-[#2A2A2A]">
                  전화번호
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="010-1234-5678"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={`h-12 border-[#DDDDDD] focus:border-[#B87C4C] ${
                    phoneError ? "border-red-500" : ""
                  }`}
                  required
                />
                {phoneError && (
                  <p className="text-sm text-red-500">{phoneError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth" className="text-[#2A2A2A]">
                  생년월일
                </Label>
                <Input
                  id="birth"
                  type="date"
                  value={formData.birth}
                  onChange={(e) => handleInputChange("birth", e.target.value)}
                  className="h-12 border-[#DDDDDD] focus:border-[#B87C4C]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-[#2A2A2A]">
                  주소지 (도로명주소)
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="예: 서울특별시 강남구 테헤란로 123"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="h-12 border-[#DDDDDD] focus:border-[#B87C4C]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#2A2A2A]">성별</Label>
                <div className="flex gap-4">
                  <label
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition
        ${
          formData.gender === "M"
            ? "bg-[#B87C4C] text-white border-[#B87C4C]"
            : "bg-[#F7F4EA] text-[#2A2A2A] border-[#DDDDDD] hover:bg-[#EBD9D1]"
        }
      `}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value="M"
                      checked={formData.gender === "M"}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      className="hidden"
                      required
                    />
                    <Mars className="w-4 h-4" />
                    <span>남성</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition
        ${
          formData.gender === "F"
            ? "bg-[#B87C4C] text-white border-[#B87C4C]"
            : "bg-[#F7F4EA] text-[#2A2A2A] border-[#DDDDDD] hover:bg-[#EBD9D1]"
        }
      `}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value="F"
                      checked={formData.gender === "F"}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      className="hidden"
                      required
                    />
                    <Venus className="w-4 h-4" />
                    <span>여성</span>
                  </label>
                </div>
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#2A2A2A]">
                  비밀번호 확인
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className={`h-12 border-[#DDDDDD] focus:border-[#B87C4C] ${
                    passwordError ? "border-red-500" : ""
                  }`}
                  required
                />
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#B87C4C] hover:bg-[#A0633E] text-white text-base font-medium rounded-lg mt-6 disabled:opacity-70"
                disabled={submitting}
              >
                회원가입 완료
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#555555]">
                이미 계정이 있으신가요?{" "}
                <button
                  onClick={() => router.push("/login")}
                  className="text-[#B87C4C] hover:underline font-medium"
                >
                  로그인
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
