import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react';
import { useVault } from '../contexts/VaultContext';
import { loadCourseRecord, saveCourseRecord, COURSE_COLUMNS, type CourseRecord } from '../lib/courseStorage';
import { fetchManifest, loadPublishedEntry } from '../lib/manifestLoader';
import { UnlockPrompt } from '../components/UnlockPrompt';

export function CourseDetail() {
  const { date } = useParams<{ date: string }>();
  const { isUnlocked, password } = useVault();
  const [record, setRecord] = useState<CourseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (isUnlocked && date && password) {
      loadRecord();
    } else {
      setLoading(false);
    }
  }, [isUnlocked, date, password]);

  const loadRecord = async () => {
    if (!password || !date) return;

    try {
      // Try local first
      const local = await loadCourseRecord(date, password);
      if (local) {
        setRecord(local);
        setIsPublished(false);
        setLoading(false);
        return;
      }

      // Try published
      const manifest = await fetchManifest('/data');
      const metadata = manifest.entries.find(e => e.type === 'course' && e.date === date);
      
      if (metadata) {
        const published = await loadPublishedEntry(metadata, password, '/data');
        
        // Convert to CourseRecord format
        const courseData = typeof published.content === 'string' 
          ? JSON.parse(published.content)
          : published.content;
        
        // Handle both root format {courses: [...]} and wrapped format {content: {courses: [...]}}
        const actualData = courseData.content || courseData;
        
        setRecord({
          id: published.id,
          date: published.date,
          courses: actualData.courses || [],
          totalMinutes: actualData.totalMinutes || 0,
          notes: actualData.notes,
          created: published.publishedAt,
          modified: published.publishedAt,
        });
        setIsPublished(true);
      } else {
        // Create new record
        setRecord({
          id: `course-${date}`,
          date,
          courses: COURSE_COLUMNS.map(col => ({
            name: col.name,
            targetMinutes: col.targetMinutes,
            actualMinutes: 0,
            completed: false,
          })),
          totalMinutes: 0,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to load course:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (index: number) => {
    if (!record || !password || isPublished) return;

    setSaving(true);
    const updated = { ...record };
    updated.courses = [...updated.courses];
    updated.courses[index] = {
      ...updated.courses[index],
      completed: !updated.courses[index].completed,
      actualMinutes: updated.courses[index].completed ? 0 : updated.courses[index].targetMinutes,
    };
    updated.totalMinutes = updated.courses.reduce((sum, c) => sum + c.actualMinutes, 0);
    updated.modified = new Date().toISOString();

    try {
      await saveCourseRecord(updated, password);
      setRecord(updated);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateReflection = async (index: number, reflection: string) => {
    if (!record || !password || isPublished) return;

    const updated = { ...record };
    updated.courses = [...updated.courses];
    updated.courses[index] = {
      ...updated.courses[index],
      reflection,
    };
    updated.modified = new Date().toISOString();

    try {
      await saveCourseRecord(updated, password);
      setRecord(updated);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="course-detail">
        <header className="page-header">
          <div className="header-row">
            <Link to="#/learning" className="back-button">
              <ArrowLeft size={20} />
            </Link>
            <h1>学习记录 - {date}</h1>
          </div>
        </header>
        <UnlockPrompt 
          message="请先解锁保险库才能查看学习详情和记录完成状态"
          returnPath={`/learning/${date}`}
        />
      </div>
    );
  }

  if (loading) {
    return <div className="card"><p>加载中...</p></div>;
  }

  if (!record) {
    return <div className="card"><p>记录不存在</p></div>;
  }

  return (
    <div className="course-detail">
      <header className="page-header">
        <div className="header-row">
          <Link to="#/learning" className="back-button">
            <ArrowLeft size={20} />
          </Link>
          <h1>学习记录 - {date}</h1>
        </div>
      </header>

      <div className="course-columns">
        {record.courses.map((course, index) => {
          const columnDef = COURSE_COLUMNS.find(c => c.name === course.name);
          return (
            <div key={course.name} className="course-column card">
              <div className="column-header">
                <h3>{columnDef?.label || course.name}</h3>
                <div className="target-time">目标: {course.targetMinutes}分钟</div>
              </div>

              <div className="completion-row">
                <button
                  className="completion-toggle"
                  onClick={() => toggleComplete(index)}
                  disabled={isPublished || saving}
                  title={isPublished ? '已发布的记录是只读的' : ''}
                >
                  {course.completed ? (
                    <CheckCircle size={24} className="completed" />
                  ) : (
                    <Circle size={24} />
                  )}
                  <span>{course.completed ? '已完成' : '未完成'}</span>
                </button>
                {course.completed && (
                  <div className="actual-time">{course.actualMinutes}分钟</div>
                )}
              </div>

              {course.materials && course.materials.length > 0 && (
                <div className="course-section">
                  <h4>学习材料</h4>
                  <ul>
                    {course.materials.map((material, i) => (
                      <li key={i}>{material}</li>
                    ))}
                  </ul>
                </div>
              )}

              {course.exercises && course.exercises.length > 0 && (
                <div className="course-section">
                  <h4>练习内容</h4>
                  <ul>
                    {course.exercises.map((exercise, i) => (
                      <li key={i}>{exercise}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!isPublished && (
                <div className="course-section">
                  <h4>学习反思</h4>
                  <textarea
                    value={course.reflection || ''}
                    onChange={(e) => updateReflection(index, e.target.value)}
                    placeholder="记录今天的学习心得..."
                    rows={3}
                  />
                </div>
              )}

              {isPublished && course.reflection && (
                <div className="course-section">
                  <h4>学习反思</h4>
                  <p>{course.reflection}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="course-summary card">
        <h3>今日总结</h3>
        <div className="summary-stat">
          <span>总学习时长:</span>
          <strong>{record.totalMinutes}分钟</strong>
        </div>
        <div className="summary-stat">
          <span>完成率:</span>
          <strong>
            {Math.round((record.courses.filter(c => c.completed).length / record.courses.length) * 100)}%
          </strong>
        </div>
      </div>

      <style>{`
        .course-columns {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }

        .course-column {
          padding: var(--spacing-lg);
        }

        .column-header {
          margin-bottom: var(--spacing-md);
          padding-bottom: var(--spacing-sm);
          border-bottom: 2px solid var(--color-primary);
        }

        .column-header h3 {
          margin: 0 0 var(--spacing-xs) 0;
          color: var(--color-primary);
        }

        .target-time {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .completion-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-md);
        }

        .completion-toggle {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          background: none;
          border: none;
          padding: var(--spacing-sm);
          cursor: pointer;
          font-size: var(--font-size-base);
          color: var(--color-text);
        }

        .completion-toggle:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .completion-toggle svg {
          color: var(--color-text-secondary);
        }

        .completion-toggle svg.completed {
          color: var(--color-success);
        }

        .actual-time {
          font-weight: 600;
          color: var(--color-success);
        }

        .course-section {
          margin-top: var(--spacing-md);
        }

        .course-section h4 {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .course-section ul {
          margin: 0;
          padding-left: var(--spacing-lg);
        }

        .course-section textarea {
          width: 100%;
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          font-family: inherit;
          font-size: var(--font-size-sm);
          resize: vertical;
        }

        .course-summary {
          padding: var(--spacing-lg);
        }

        .summary-stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm) 0;
          font-size: var(--font-size-lg);
        }

        .back-button {
          padding: var(--spacing-sm);
          text-decoration: none;
          color: var(--color-text);
        }
      `}</style>
    </div>
  );
}
