'use client';

import { Code, ExternalLink } from 'lucide-react';

interface AppsScriptProjectListProps {
  projects: any[];
  onOpenProject: (project: any) => void;
}

export default function AppsScriptProjectList({ projects, onOpenProject }: AppsScriptProjectListProps) {
  if (!projects || projects.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
        <Code className="w-4 h-4" />
        Available Apps Script Projects
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {projects.map((project: any, idx) => (
          <div 
            key={idx} 
            className="flex items-center gap-3 p-3 bg-zinc-700/50 border border-zinc-600/50 rounded-lg hover:bg-zinc-700 hover:border-zinc-500 transition-all cursor-pointer group"
            onClick={() => onOpenProject(project)}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500/20 group-hover:border-yellow-500/30 transition-colors">
              <Code className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                {project.name || project}
              </h4>
              <p className="text-xs text-zinc-500 truncate mt-0.5">
                Click to open editor
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:text-zinc-400 transition-all -translate-x-2 group-hover:translate-x-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
