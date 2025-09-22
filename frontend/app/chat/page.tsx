"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, Bot, User, Mic, MicOff, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  emotion?: string;
}

export default function ChatInterface() {
  const [userName, setUserName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  useEffect(() => {
    if (userName) {
      setMessages([
        {
          id: "1",
          content: `안녕하세요, ${userName}님! 오늘 기분은 어떠신가요?`,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
  }, [userName]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    // 1. 유저 메시지 추가
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // 2. 서버에 메시지 전송
      const { data } = await api.post("/api/chat", {
        user_input: userMessage.content,
      });

      // 3. 응답 메시지 생성
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.ai_response,
        sender: "ai",
        timestamp: new Date(),
        emotion: data.sentiment_label,
      };

      // 4. AI 응답 추가
      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      console.error("AI 응답 실패:", err);
      const errorResponse: Message = {
        id: (Date.now() + 2).toString(),
        content: "서버와 통신 중 문제가 발생했습니다. 다시 시도해주세요.",
        sender: "ai",
        timestamp: new Date(),
        emotion: "에러",
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition);

    if (!SpeechRecognition) {
      if (isListening) {
        alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
        setIsListening(false);
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript); // 입력창에 반영
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("STT 에러:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.start();
    } else {
      recognition.stop();
    }

    return () => {
      recognition.stop();
    };
  }, [isListening]);

  const toggleVoiceInput = () => {
    setIsListening((prev) => !prev);
  };

  const handleEmergencyCall = () => {
    alert("응급 상황이 감지되어 담당 복지사에게 연락합니다.");
  };

  return (
    <div className="h-screen bg-[#F7F4EA] flex flex-col">
      <header className="bg-[#A8BBA3] shadow-sm flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#B87C4C] rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">AI 상담사</h1>
                  <p className="text-sm text-white/80">온라인</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={handleEmergencyCall}
            >
              <Phone className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === "user"
                        ? "bg-[#B87C4C]"
                        : "bg-[#A8BBA3]"
                    }`}
                  >
                    {message.sender === "user" ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>

                  <div
                    className={`flex flex-col ${
                      message.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <Card
                      className={`shadow-[0px_2px_6px_rgba(0,0,0,0.1)] border-0 ${
                        message.sender === "user"
                          ? "bg-[#B87C4C] text-white"
                          : "bg-white"
                      }`}
                    >
                      <CardContent className="p-4">
                        <p
                          className={`text-base leading-relaxed ${
                            message.sender === "user"
                              ? "text-white"
                              : "text-[#2A2A2A]"
                          }`}
                        >
                          {message.content}
                        </p>
                        {message.emotion && (
                          <Badge
                            variant="secondary"
                            className="mt-2 bg-[#EBD9D1] text-[#B87C4C]"
                          >
                            감지된 감정: {message.emotion}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                    <span className="text-xs text-[#555555] mt-1">
                      {message.timestamp.toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-10 h-10 bg-[#A8BBA3] rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <Card className="shadow-[0px_2px_6px_rgba(0,0,0,0.1)] bg-white border-0">
                    <CardContent className="p-4">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#B87C4C] rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-[#B87C4C] rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-[#B87C4C] rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-[#DDDDDD] p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                className="focus:border-[#B87C4C] focus:ring-2 focus:ring-[#B87C4C]/30 focus:ring-offset-0 h-12 text-base"
                disabled={isLoading}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={`h-12 w-12 ${
                isListening ? "bg-[#E74C3C] text-white" : "text-[#B87C4C]"
              }`}
              onClick={toggleVoiceInput}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>
            <Button
              className="h-12 w-12 bg-[#B87C4C] hover:bg-[#A0633E] text-white"
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          {/* Quick Responses */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              "기분이 좋아요",
              "조금 우울해요",
              "외로워요",
              "도움이 필요해요",
            ].map((quickResponse) => (
              <Button
                key={quickResponse}
                variant="outline"
                size="sm"
                className="bg-[#F7F4EA] text-[#B87C4C] border-[#B87C4C] hover:bg-[#EBD9D1] text-sm"
                onClick={() => setInputMessage(quickResponse)}
              >
                {quickResponse}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
