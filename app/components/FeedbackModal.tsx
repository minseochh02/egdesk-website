'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { X, Send, Loader2, MessageSquare, RefreshCw, User, Globe } from 'lucide-react';

interface FeedbackModalProps {
  onClose: () => void;
}

interface FeedbackItem {
  id: string | number;
  created_at: string;
  name: string | null;
  email: string | null;
  message: string;
  page_url: string | null;
  user_agent: string | null;
  client_id: string | null;
}

// 실제 Supabase feedback 테이블 컬럼 구조에 정확히 맞춘 한국어 모의 데이터 (Mock Data)
const MOCK_FEEDBACKS: FeedbackItem[] = [
  {
    id: 'mock-1',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15분 전
    name: 'EGDESK 최고관리자',
    email: 'chachagreat@gmail.com',
    message: '사이드바 하단에 피드백 게시판 연동이 완벽하게 완료되었습니다! 대시보드가 대단히 직관적입니다.',
    page_url: '/hr/attendance',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    client_id: 'FB-1780297729873-809'
  },
  {
    id: 'mock-2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3시간 전
    name: '일반 테스터',
    email: 'user1@example.com',
    message: '원격으로 내 PC의 Apps Script를 직접 제어하고 관리할 수 있어 정말 편리한 도구네요. UI 디자인도 마음에 듭니다.',
    page_url: '/editor',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    client_id: 'FB-1780298817263-102'
  },
  {
    id: 'mock-3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2일 전
    name: '이순신 장군',
    email: 'navy_hero@chosun.kr',
    message: 'AI 채팅 응답 속도가 상당히 만족스럽습니다. 다크 모드가 적용되어 장시간 업무에도 눈에 피로가 없네요.',
    page_url: '/chat',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    client_id: 'FB-1780299920192-349'
  }
];

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'write' | 'list'>('list');
  const [name, setName] = useState<string>('');
  const [content, setContent] = useState<string>(''); // 입력된 피드백 메시지
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 현재 사용자 정보를 바탕으로 이름 자동 셋업
  useEffect(() => {
    if (user) {
      const defaultName = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
      setName(defaultName);
    }
  }, [user]);

  // 피드백 데이터 로드 함수
  const fetchFeedbacks = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Supabase 테이블로부터 피드백 리스트 조회 시도
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setFeedbacks(data as FeedbackItem[]);
        setIsDemoMode(false);
      }
    } catch (error: any) {
      console.warn('Supabase feedback 테이블 조회 실패. 모의 데이터로 전환합니다:', error.message);
      setFeedbacks(MOCK_FEEDBACKS);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // 피드백 제출 처리 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const userEmail = user?.email || 'anonymous@user.com';

    try {
      if (isDemoMode) {
        // 데모 모드일 때는 로컬 리스트에 시뮬레이션 삽입
        const newDemoFeedback: FeedbackItem = {
          id: `demo-${Date.now()}`,
          created_at: new Date().toISOString(),
          name: name.trim() || '익명 사용자',
          email: userEmail,
          message: content,
          page_url: window.location.pathname,
          user_agent: navigator.userAgent,
          client_id: `FB-${Date.now()}`
        };
        setFeedbacks(prev => [newDemoFeedback, ...prev]);
        setSuccessMsg('피드백이 성공적으로 등록되었습니다! (데모 모드 시뮬레이션)');
        setContent('');
        setTimeout(() => {
          setActiveTab('list');
          setSuccessMsg(null);
        }, 1500);
      } else {
        // 실제 Supabase feedback 테이블 컬럼 매핑에 맞춰 삽입 (message, name, email 등)
        const { error } = await supabase.from('feedback').insert([
          {
            name: name.trim() || '익명 사용자',
            email: userEmail,
            message: content, // 사용자 메시지 내용
            page_url: window.location.pathname,
            user_agent: navigator.userAgent,
            client_id: `FB-${Date.now()}-${Math.floor(Math.random() * 1000)}`
          }
        ]);

        if (error) throw error;

        setSuccessMsg('피드백을 전송해 주셔서 감사합니다! 소중한 의견이 등록되었습니다.');
        setContent('');
        
        // 피드백 목록 갱신
        await fetchFeedbacks();
        
        setTimeout(() => {
          setActiveTab('list');
          setSuccessMsg(null);
        }, 1500);
      }
    } catch (error: any) {
      console.error('피드백 등록 중 오류 발생:', error.message);
      setErrorMsg('피드백 전송에 실패했습니다. DB RLS 정책이나 필드 제약을 확인해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // 작성 시간 포맷팅 헬퍼
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl transition-all duration-300 scale-in animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">피드백 남기기</h2>
            {isDemoMode && (
              <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xxs font-medium text-yellow-400 border border-yellow-500/20">
                데모 모드
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            title="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 탭 헤더 */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/20 px-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`border-b-2 py-3 px-4 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            피드백 목록 ({feedbacks.length})
          </button>
          <button
            onClick={() => setActiveTab('write')}
            className={`border-b-2 py-3 px-4 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'write'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            의견 작성
          </button>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          
          {successMsg && (
            <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400 animate-in slide-in-from-top-2 duration-200">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 animate-in slide-in-from-top-2 duration-200">
              {errorMsg}
            </div>
          )}

          {activeTab === 'write' ? (
            /* 의견 작성 폼 */
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* 작성자 이름 */}
              <div className="space-y-2">
                <label htmlFor="feedback-username" className="text-sm font-semibold text-zinc-300 block">
                  작성자 이름
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    id="feedback-username"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="작성자의 이름을 적어주세요."
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* 피드백 메시지 본문 */}
              <div className="space-y-2">
                <label htmlFor="feedback-msg" className="text-sm font-semibold text-zinc-300 block">
                  제안 및 개선 내용
                </label>
                <textarea
                  id="feedback-msg"
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="EGDesk 서비스에 관한 제안이나 개선사항을 작성해 주세요. 작성하신 소중한 의견은 즉시 피드백 데이터베이스에 동기화됩니다."
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                />
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    제출 중...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    피드백 제출하기
                  </>
                )}
              </button>
            </form>
          ) : (
            /* 피드백 리스트 */
            <div className="space-y-4">
              
              <div className="flex items-center justify-between text-xs text-zinc-500 pb-1">
                <span>
                  {isDemoMode 
                    ? '※ DB 연결 실패 (모의 데모 데이터 표시 중)' 
                    : 'Supabase DB와 다이렉트 동기화된 실제 데이터입니다.'}
                </span>
                <button
                  onClick={fetchFeedbacks}
                  disabled={loading}
                  className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
                  type="button"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  새로고침
                </button>
              </div>

              {loading && feedbacks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-sm">데이터 조회 중...</p>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                  <MessageSquare className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm font-medium">첫 번째 피드백을 남겨주세요!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 hover:border-zinc-700 transition-all duration-150"
                    >
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div>
                          <span className="text-xs font-bold text-zinc-200">
                            {item.name || '익명 사용자'}
                          </span>
                          <span className="text-xxs text-zinc-500 block">
                            {item.email ? item.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '비회원'} • {formatTime(item.created_at)}
                          </span>
                        </div>
                        {item.page_url && (
                          <div className="flex items-center gap-1 text-xxs text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-lg border border-zinc-800 flex-shrink-0">
                            <Globe className="h-3 w-3 text-zinc-500" />
                            <span>{item.page_url}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed mt-2">
                        {item.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
