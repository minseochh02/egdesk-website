'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { MessageSquare, RefreshCw, Search, Plus, Calendar, Mail, ArrowUpDown, ChevronRight, X, AlertTriangle, User, Globe, Laptop } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

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
const INITIAL_MOCK_FEEDBACKS: FeedbackItem[] = [
  {
    id: 'mock-1',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15분 전
    name: 'EGDESK 최고관리자',
    email: 'chachagreat@gmail.com',
    message: '[통합 테스트 완료]\n사이드바 하단에 피드백 게시판 연동이 성공적으로 마쳤습니다! 실시간 DB 조회 성능이 대단히 뛰어납니다.',
    page_url: '/hr/attendance',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    client_id: 'FB-1780297729873-809'
  },
  {
    id: 'mock-2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3시간 전
    name: '일반 사용자',
    email: 'user_tester@gmail.com',
    message: '원격으로 내 PC의 Apps Script를 직접 제어하고 관리할 수 있어 정말 혁신적인 도구입니다. UI도 매우 직관적이고 다크 모드가 아름답습니다.',
    page_url: '/editor',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36',
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
  },
  {
    id: 'mock-4',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4일 전
    name: '개발 리드',
    email: 'cloud_architect@infra.io',
    message: '구글 계정 연동만으로 번거로운 터널링 설정 없이 로컬 LLM 서버를 구동할 수 있어 무척 편리합니다. 앞으로도 좋은 업데이트 부탁드립니다.',
    page_url: '/settings',
    user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    client_id: 'FB-1780300182912-108'
  },
  {
    id: 'mock-5',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7일 전
    name: '버그 헌터',
    email: 'bug_hunter@gmail.com',
    message: '사이드바 축소 시 일부 툴팁의 위치가 살짝 불안정한 현상이 있었으나, 전체적인 기능성은 아주 훌륭합니다. 파일 업로더 속도도 무척 빠르네요.',
    page_url: '/',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    client_id: 'FB-1780305528172-882'
  }
];

export default function FeedbackBoard() {
  const { user } = useAuth();
  
  // 데이터 상태 관리
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 검색 및 필터 상태 관리
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageFilter, setPageFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // 상세 보기 및 글쓰기 모달 제어 상태
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);

  // 피드백 데이터 로드 함수
  const fetchFeedbacks = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Supabase 테이블로부터 피드백 조회 시도
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
      // 테이블이 없거나 접속 실패 시 예쁜 더미 데이터로 대체하여 기능 시각화
      setFeedbacks(INITIAL_MOCK_FEEDBACKS);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // 통계 계산 헬퍼 함수들 (useMemo 활용으로 성능 최적화)
  const stats = useMemo(() => {
    if (feedbacks.length === 0) {
      return { total: 0, todayCount: 0, emailRate: '0%' };
    }
    const total = feedbacks.length;
    
    // 최근 24시간 피드백 건수
    const oneDayAgo = Date.now() - 1000 * 60 * 60 * 24;
    const todayCount = feedbacks.filter(f => new Date(f.created_at).getTime() >= oneDayAgo).length;
    
    // 이메일 등록률 (익명이 아닌 유효 피드백 비율)
    const validEmails = feedbacks.filter(f => f.email && f.email !== 'anonymous@user.com').length;
    const emailRate = `${Math.round((validEmails / total) * 100)}%`;

    return { total, todayCount, emailRate };
  }, [feedbacks]);

  // 고유 제안 경로(Page URL) 목록 추출 (드롭다운 필터용)
  const uniquePages = useMemo(() => {
    const pages = new Set<string>();
    feedbacks.forEach(f => {
      if (f.page_url) {
        pages.add(f.page_url);
      }
    });
    return Array.from(pages);
  }, [feedbacks]);

  // 검색어 필터링, 경로 필터링, 정렬 적용
  const filteredAndSortedFeedbacks = useMemo(() => {
    let result = [...feedbacks];

    // 1. 검색어 필터링 (이름, 이메일 및 본문)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => 
        (f.name && f.name.toLowerCase().includes(query)) ||
        (f.email && f.email.toLowerCase().includes(query)) ||
        f.message.toLowerCase().includes(query)
      );
    }

    // 2. 경로별 필터링
    if (pageFilter !== 'all') {
      result = result.filter(f => f.page_url === pageFilter);
    }

    // 3. 작성 시간순 정렬
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [feedbacks, searchQuery, pageFilter, sortOrder]);

  // 상대 시간 표시 헬퍼 함수
  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-100 p-6 overflow-y-auto">
      
      {/* 최상단 타이틀 & 액션 툴바 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">피드백 의견 게시판</h1>
            {isDemoMode && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
                <AlertTriangle className="h-3.5 w-3.5" />
                데모 모드 작동 중
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            원격 Supabase 데이터베이스와 다이렉트 연동된 실제 사용자들의 피드백 내용들을 게시판 형태로 관리합니다.
          </p>
        </div>
        
        {/* 새로고침 및 새 글 작성 버튼 */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => fetchFeedbacks()}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-800 hover:text-white transition-all text-zinc-300"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          <button
            onClick={() => setIsWriteModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            새 피드백 작성
          </button>
        </div>
      </div>

      {/* 통계 요약 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        
        {/* 1. 누적 피드백 수 */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-sm">
          <div className="absolute right-4 bottom-2 opacity-5">
            <MessageSquare className="h-24 w-24 text-blue-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">누적 피드백 건수</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.total}</span>
            <span className="text-sm font-medium text-zinc-500">건의 피드백 의견 수집됨</span>
          </div>
        </div>

        {/* 2. 최근 24시간 등록 */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-sm">
          <div className="absolute right-4 bottom-2 opacity-5">
            <Calendar className="h-24 w-24 text-teal-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">최근 24시간 등록 건수</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-teal-400">{stats.todayCount}</span>
            <span className="text-sm font-medium text-zinc-500">건의 최근 작성글</span>
          </div>
        </div>

        {/* 3. 로그인 이메일 등록률 */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-sm">
          <div className="absolute right-4 bottom-2 opacity-5">
            <Mail className="h-24 w-24 text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">유효 이메일 식별률</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-400">{stats.emailRate}</span>
            <span className="text-sm font-medium text-zinc-500">로그인 사용자 비율</span>
          </div>
        </div>
      </div>

      {/* 필터 및 정렬 컨트롤러 바 */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-900/40 border border-zinc-850 rounded-2xl p-4 mb-6">
        
        {/* 키워드 검색 */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="이름, 이메일 주소 또는 피드백 내용으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 제안 경로(Page URL) 필터 */}
        <div className="w-full sm:w-48 flex-shrink-0">
          <select
            value={pageFilter}
            onChange={(e) => setPageFilter(e.target.value)}
            className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800 px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">🌐 모든 전송 경로</option>
            {uniquePages.map(page => (
              <option key={page} value={page}>{page}</option>
            ))}
          </select>
        </div>

        {/* 작성일 정렬 기준 */}
        <button
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-zinc-850 bg-zinc-950/40 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all flex-shrink-0"
        >
          <ArrowUpDown className="h-4 w-4" />
          <span>{sortOrder === 'desc' ? '최신순' : '오래된순'}</span>
        </button>
      </div>

      {/* 게시판 리스트 테이블 */}
      <div className="flex-1 min-h-0">
        {loading && feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">실시간 Supabase DB 피드백 데이터를 조회 중입니다...</p>
          </div>
        ) : filteredAndSortedFeedbacks.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
            <MessageSquare className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-zinc-400">일치하는 피드백 정보가 없습니다.</p>
            <p className="text-xs text-zinc-600 mt-1">검색어나 전송 경로 필터를 변경한 뒤 다시 조회해 주세요.</p>
          </div>
        ) : (
          /* 게시판 형태의 목록 테이블 */
          <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-zinc-900/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/35 text-zinc-400 font-semibold select-none">
                    <th className="py-4 px-6 w-16 text-center">No.</th>
                    <th className="py-4 px-6 w-44">작성자 이름</th>
                    <th className="py-4 px-6 w-52">이메일 주소</th>
                    <th className="py-4 px-6 w-44">제안 경로 (URL)</th>
                    <th className="py-4 px-6">피드백 의견 내용</th>
                    <th className="py-4 px-6 w-36">작성 시간</th>
                    <th className="py-4 px-6 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {filteredAndSortedFeedbacks.map((item, idx) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedFeedback(item)}
                      className="hover:bg-zinc-900/40 cursor-pointer transition-all duration-150 group"
                    >
                      {/* 1. 번호 */}
                      <td className="py-4 px-6 text-zinc-500 text-center font-medium">
                        {sortOrder === 'desc' 
                          ? filteredAndSortedFeedbacks.length - idx 
                          : idx + 1}
                      </td>

                      {/* 2. 이름 */}
                      <td className="py-4 px-6 font-semibold text-zinc-200">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                          <span className="truncate block">{item.name || '익명 사용자'}</span>
                        </div>
                      </td>

                      {/* 3. 이메일 */}
                      <td className="py-4 px-6 font-medium text-zinc-400">
                        <span className="truncate block">
                          {item.email 
                            ? item.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') 
                            : '비회원'}
                        </span>
                      </td>

                      {/* 4. 제안 경로 URL */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1 text-xxs text-zinc-400 bg-zinc-900/80 border border-zinc-800 px-2 py-0.8 rounded-lg w-fit">
                          <Globe className="h-3 w-3 text-zinc-500" />
                          <span>{item.page_url || '/'}</span>
                        </div>
                      </td>

                      {/* 5. 피드백 메시지 본문 */}
                      <td className="py-4 px-6 text-zinc-300 max-w-xs md:max-w-md lg:max-w-lg">
                        <p className="truncate block group-hover:text-white transition-colors">
                          {item.message}
                        </p>
                      </td>

                      {/* 6. 작성 일시 */}
                      <td className="py-4 px-6 text-zinc-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                          <span>{formatRelativeTime(item.created_at)}</span>
                        </div>
                      </td>

                      {/* 7. 상세 화살표 */}
                      <td className="py-4 px-6 text-center">
                        <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* A. 상세 보기 팝업 모달 */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedFeedback(null)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            {/* 닫기 버튼 */}
            <button
              onClick={() => setSelectedFeedback(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* 헤더 및 작성 정보 */}
            <div className="flex flex-col gap-1.5 mb-5 pb-4 border-b border-zinc-850">
              <span className="text-xxs font-semibold text-zinc-500 uppercase tracking-wider">피드백 송신 정보</span>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                <User className="h-4 w-4 text-blue-400" />
                {selectedFeedback.name || '익명 사용자'}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-zinc-500" />
                  {selectedFeedback.email ? selectedFeedback.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '비회원'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                  {new Date(selectedFeedback.created_at).toLocaleString('ko-KR')}
                </span>
              </div>
            </div>

            {/* 메타데이터 상세 정보 (Page URL, Client ID, User Agent) */}
            <div className="grid grid-cols-2 gap-3 mb-5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-900 text-xs">
              <div>
                <span className="text-xxs text-zinc-500 font-semibold block uppercase">제안 경로 (Page URL)</span>
                <span className="text-zinc-300 font-medium mt-0.5 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-zinc-500" />
                  {selectedFeedback.page_url || '/'}
                </span>
              </div>
              <div>
                <span className="text-xxs text-zinc-500 font-semibold block uppercase">전송 식별 코드 (Client ID)</span>
                <span className="text-zinc-300 font-mono mt-0.5 truncate block" title={selectedFeedback.client_id || ''}>
                  {selectedFeedback.client_id || 'N/A'}
                </span>
              </div>
              <div className="col-span-2 border-t border-zinc-850/50 pt-2 mt-1">
                <span className="text-xxs text-zinc-500 font-semibold block uppercase">원격 환경 정보 (User Agent)</span>
                <span className="text-zinc-400 mt-0.5 block truncate flex items-center gap-1" title={selectedFeedback.user_agent || ''}>
                  <Laptop className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" />
                  <span className="truncate">{selectedFeedback.user_agent || 'Unknown Agent'}</span>
                </span>
              </div>
            </div>

            {/* 상세 메시지 본문 */}
            <div className="flex-1 overflow-y-auto min-h-0 mb-6">
              <span className="text-xxs font-semibold text-zinc-500 block uppercase mb-2">피드백 의견 상세 내용</span>
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl max-h-[30vh] overflow-y-auto">
                {selectedFeedback.message}
              </p>
            </div>

            {/* 하단 닫기 */}
            <div className="flex justify-end pt-2 border-t border-zinc-850">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 px-5 py-2 text-sm font-semibold text-zinc-300 hover:text-white transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. 새 피드백 작성 모달 */}
      {isWriteModalOpen && (
        <FeedbackModal 
          onClose={() => {
            setIsWriteModalOpen(false);
            fetchFeedbacks(); // 피드백 작성 완료 후 리스트 새로고침
          }} 
        />
      )}
    </div>
  );
}
