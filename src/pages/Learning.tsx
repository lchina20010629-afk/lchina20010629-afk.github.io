import { BookOpen, Clock } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export function Learning() {
  const courses = [
    { name: '英语', target: 10, color: '#4A90E2' },
    { name: '泰语', target: 8, color: '#7FB069' },
    { name: '修身养性', target: 6, color: '#E8A838' },
    { name: '生财有道真实案例', target: 6, color: '#D64545' },
  ];

  const totalMinutes = courses.reduce((sum, course) => sum + course.target, 0);

  return (
    <div className="learning">
      <header className="page-header">
        <h1>成长学习</h1>
        <p className="text-muted">持续学习，不断成长</p>
      </header>

      <div className="learning-overview card" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2>每日学习计划</h2>
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.name} className="course-card">
              <div className="course-icon" style={{ backgroundColor: `${course.color}20`, color: course.color }}>
                <BookOpen size={20} />
              </div>
              <h3>{course.name}</h3>
              <div className="course-time">
                <Clock size={16} />
                <span>{course.target} 分钟</span>
              </div>
            </div>
          ))}
        </div>
        <div className="total-time">
          <strong>每日总计：</strong> {totalMinutes} 分钟
        </div>
      </div>

      <EmptyState
        icon={BookOpen}
        title="暂无学习记录"
        description="开始您的学习之旅吧！记录下每一次的学习成果和感悟。"
      />

      <style>{`
        .learning-overview h2 {
          margin-bottom: var(--spacing-lg);
        }

        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .course-card {
          background-color: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
        }

        .course-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--spacing-md);
        }

        .course-card h3 {
          font-size: var(--font-size-base);
          margin-bottom: var(--spacing-sm);
        }

        .course-time {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .total-time {
          text-align: center;
          padding: var(--spacing-md);
          background-color: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          font-size: var(--font-size-lg);
        }
      `}</style>
    </div>
  );
}
