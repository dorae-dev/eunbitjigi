import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calcAge(birthIso: string): number {
  const birth = new Date(birthIso);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  // 생일이 아직 안 지났으면 -1
  const hasBirthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate());

  if (!hasBirthdayPassed) {
    age--;
  }

  return age;
}

export function formatPhoneNumber(phone: string): string {
  // 숫자만 남기기
  const digits = phone.replace(/\D/g, "");

  // 010으로 시작하는 경우
  if (digits.startsWith("010") && digits.length === 11) {
    return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }

  // 다른 패턴도 대응 (예: 지역번호 02, 031 등)
  if (digits.length === 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }

  if (digits.length === 9) {
    return digits.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
  }

  // 기본: 그대로 반환
  return phone;
}

export function formatGender(input: string): string {
  if (!input) return "-";

  const normalized = input.trim().toLowerCase();

  // 남성 패턴
  const maleValues = ["m", "male", "man", "남", "남자"];
  if (maleValues.includes(normalized)) {
    return "남성";
  }

  // 여성 패턴
  const femaleValues = ["f", "female", "woman", "여", "여자"];
  if (femaleValues.includes(normalized)) {
    return "여성";
  }

  // 기본값 (모르는 경우 원본 반환)
  return input;
}
