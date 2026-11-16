import { BookOpen } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export function Diary() {
  return (
    <div className="diary">
      <header className="page-header">
        <h1>生活日记</h1>
        <p className="text-muted">记录每一天的点滴瞬间</p>
      </header>

      <EmptyState
        icon={BookOpen}
        title="暂无日记"
        description="开始记录您的生活吧！每一天的故事都值得被珍藏。"
      />
    </div>
  );
}
