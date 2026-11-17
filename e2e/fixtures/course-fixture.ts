import { encrypt, createPasswordVerifier } from '../../src/lib/crypto';

export const FIXTURE_PASSWORD = 'FixturePass123!@#';

// Generate synthetic published course matching real schema
export async function generatePublishedCourseFixture(date: string) {
  // Course content with 4 columns matching real structure
  const courseContent = {
    content: {
      courses: [
        {
          name: 'english',
          targetMinutes: 10,
          actualMinutes: 0,
          completed: false,
          materials: ['TED Talk: The future of learning', 'Grammar review chapter 5'],
          exercises: ['Vocabulary flashcards', 'Listening comprehension test'],
          reflection: ''
        },
        {
          name: 'thai',
          targetMinutes: 8,
          actualMinutes: 0,
          completed: false,
          materials: ['Thai script practice workbook', 'Pronunciation audio lessons'],
          exercises: ['Character writing practice', 'Conversation dialogue'],
          reflection: ''
        },
        {
          name: 'character',
          targetMinutes: 6,
          actualMinutes: 0,
          completed: false,
          materials: ['Philosophy reading: Stoicism basics', 'Meditation guide'],
          exercises: ['Daily reflection journal', 'Mindfulness practice'],
          reflection: ''
        },
        {
          name: 'wealth',
          targetMinutes: 6,
          actualMinutes: 0,
          completed: false,
          materials: ['Investment fundamentals course', 'Market analysis report'],
          exercises: ['Budget planning exercise', 'Portfolio review'],
          reflection: ''
        }
      ],
      totalMinutes: 0,
      notes: 'Synthetic fixture for E2E testing'
    }
  };

  const encrypted = await encrypt(JSON.stringify(courseContent), FIXTURE_PASSWORD);
  
  return {
    id: `course-${date}`,
    type: 'course' as const,
    date,
    content: encrypted,
    publishedAt: new Date().toISOString()
  };
}

export async function generateFixtureVerifier() {
  return await createPasswordVerifier(FIXTURE_PASSWORD);
}

export async function setupPublishedCourseFixtures(page: any, dates: string[]) {
  const verifier = await generateFixtureVerifier();
  const courses = await Promise.all(dates.map(d => generatePublishedCourseFixture(d)));
  
  const manifest = {
    version: '1.0.0',
    vault: {
      version: '1.0.0',
      verifier,
      createdAt: new Date().toISOString()
    },
    entries: courses.map(c => ({
      id: c.id,
      type: 'course' as const,
      date: c.date,
      encryptedPath: `${c.id}.json`,
      publishedAt: c.publishedAt,
      sha256: 'fixture-sha256'
    })),
    generatedAt: new Date().toISOString()
  };

  // Intercept manifest
  await page.route('**/data/manifest.json', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(manifest)
    });
  });

  // Intercept individual course files
  for (const course of courses) {
    await page.route(`**/data/${course.id}.json`, async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(course)
      });
    });
  }
}
