'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface CodingProject {
  projectName: string;
  folderPath: string;
  port: number;
  url: string;
  status: 'running' | 'stopped' | 'error';
  registeredAt: string;
}

export function useCodingProjects(tunnelId: string | null) {
  const { session } = useAuth();
  const [projects, setProjects] = useState<CodingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tunnelId || !session?.access_token) {
      setProjects([]);
      setLoading(false);
      return;
    }

    fetchCodingProjects();

    // Poll every 5 seconds to keep projects list updated
    const interval = setInterval(fetchCodingProjects, 5000);

    return () => clearInterval(interval);
  }, [tunnelId, session?.access_token]);

  const fetchCodingProjects = async () => {
    if (!tunnelId || !session?.access_token) return;

    // 환경 변수에서 터널 서비스 URL을 가져오며, 없을 경우 기본 URL을 사용합니다.
    const baseUrl = process.env.NEXT_PUBLIC_TUNNEL_SERVICE_URL || 'https://tunneling-service.onrender.com';

    try {
      // 코딩 프로젝트 정보를 가져오기 위해 터널링 서비스 API 엔드포인트를 호출합니다.
      const response = await fetch(
        `${baseUrl}/t/${tunnelId}/api/coding-projects`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // 응답 상태코드와 텍스트를 함께 표시하여 디버깅을 용이하게 합니다.
        throw new Error(`Failed to fetch coding projects: ${response.status} ${response.statusText || ''}`);
      }

      const data = await response.json();

      if (data.success && data.projects) {
        setProjects(data.projects);
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch projects');
      }
    } catch (err) {
      // 터널이 오프라인인 경우 매 5초 폴링 시마다 콘솔이 에러 로그로 도배되는 것을 방지하기 위해 warn 수준으로 완화합니다.
      console.warn('Error fetching coding projects (tunnel might be offline):', err instanceof Error ? err.message : err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    projects,
    loading,
    error,
    refresh: fetchCodingProjects,
  };
}
