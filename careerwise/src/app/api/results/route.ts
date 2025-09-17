import { NextResponse } from 'next/server';
import type { Answer } from '@/app/types/quiz';
import type { MacroAnswer } from '@/app/types/quiz';
import type { RIASECProfile } from '@/app/types/career';
import { findMatchingCareers, prepareCareerAnalysisPrompt, interpretMacroAnswer } from '@/app/lib/careerMatch';

// NEW: Firestore
import { db } from '@/app/lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface QuizSubmission {
  macroAnswers: MacroAnswer[];
  riaAnswers: Answer[];
}

interface CareerProfile {
  riasec: RIASECProfile;
  macroPreferences: Record<string, number>;
  dominantTraits: string[];
}

function calculateRIASECProfile(answers: Answer[]): RIASECProfile {
  const profile: RIASECProfile = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  console.log('=== RIASEC CALCULATION DEBUG ===');
  console.log('Total answers received:', answers.length);
  console.log('First few answers:', answers.slice(0, 5));

  // Group answers by category and calculate averages
  answers.forEach((answer, index) => {
    const category = answer.questionId.charAt(0).toUpperCase() as keyof RIASECProfile;
    console.log(
      `Answer ${index + 1}: questionId="${answer.questionId}", score=${answer.score}, category="${category}"`
    );

    if (category in profile) {
      profile[category] += answer.score;
      console.log(`  -> Added ${answer.score} to ${category}, new total: ${profile[category]}`);
    } else {
      console.log(`  -> WARNING: category "${category}" not found in profile!`);
    }
  });

  console.log('Raw totals before averaging:', { ...profile });

  // Calculate averages (assuming 10 questions per category)
  (Object.keys(profile) as (keyof RIASECProfile)[]).forEach((key) => {
    const oldValue = profile[key];
    profile[key] = profile[key] / 10;
    console.log(`${key}: ${oldValue} / 10 = ${profile[key]}`);
  });

  console.log('Final RIASEC profile:', profile);
  console.log('=== END RIASEC CALCULATION DEBUG ===');

  return profile;
}

function getDominantTraits(profile: RIASECProfile): string[] {
  return Object.entries(profile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([trait]) => trait);
}

async function getChatGPTAnalysis(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not found in environment variables');

  console.log('Calling OpenAI API...');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are a career counselor with expertise in RIASEC personality types and career matching. Provide detailed, actionable career advice based on the provided profile and career matches.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  console.log('OpenAI API response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`Failed to get analysis from ChatGPT: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function POST(request: Request) {
  try {
    // Extend incoming body to include identifiers and mode
    const body = (await request.json()) as QuizSubmission & {
      uid?: string;
      rid?: string;
      mode?: 'preview' | 'final';
    };

    const uid = body.uid || request.headers.get('x-uid') || undefined;
    const rid = body.rid;
    const mode: 'preview' | 'final' = body.mode ?? 'final';

    if (!uid) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    if (!rid) {
      return NextResponse.json({ error: 'missing_rid' }, { status: 400 });
    }
    if (!body.macroAnswers || !body.riaAnswers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('API received macroAnswers:', body.macroAnswers);
    console.log('API received riaAnswers:', body.riaAnswers);

    // 1) Compute RIASEC + macro summary
    const riasecProfile = calculateRIASECProfile(body.riaAnswers);
    const macroSummaryText = body.macroAnswers
      .map((ans: MacroAnswer) => interpretMacroAnswer(ans.questionId, ans.score))
      .filter(Boolean)
      .join('\n');

    // 2) Find matching careers
    const matchingCareers = findMatchingCareers(riasecProfile);

    // 3) Career profile object
    const careerProfile: CareerProfile = {
      riasec: riasecProfile,
      macroPreferences: {}, // TODO: expand if you add macro dimension scoring
      dominantTraits: getDominantTraits(riasecProfile),
    };

    // 4) Preview path: save rolling snapshot to the draft and return quickly (no AI call)
    if (mode === 'preview') {
      await updateDoc(doc(db, 'users', uid, 'drafts', rid), {
        preview: {
          profile: careerProfile,
          matchingCareers,
          at: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        mode: 'preview',
        profile: careerProfile,
        matchingCareers,
      });
    }

    // 5) Final path: build prompt, call AI for analysis, persist immutable result, mark draft done, clear activeRid
    const prompt = prepareCareerAnalysisPrompt(riasecProfile, macroSummaryText);
    const analysis = await getChatGPTAnalysis(prompt);

    // Save immutable free result (you can use rid as resultId)
    const resultRef = doc(db, 'users', uid, 'results', rid);
    await setDoc(resultRef, {
      type: 'free',
      rid,
      profile: careerProfile,
      matchingCareers,
      analysis,
      completedAt: serverTimestamp(),
    });

    // Mark draft as finished
    await updateDoc(doc(db, 'users', uid, 'drafts', rid), {
      status: 'free_done',
      freeResultRef: resultRef.path,
      updatedAt: serverTimestamp(),
    });

    // **Clear activeRid so next "Quiz" starts a fresh draft**
    await updateDoc(doc(db, 'users', uid), { activeRid: null });

    return NextResponse.json({
      success: true,
      mode: 'final',
      rid,
      profile: careerProfile,
      matchingCareers,
      analysis,
    });
  } catch (error) {
    console.error('Error processing quiz submission:', error);
    return NextResponse.json({ error: 'Failed to process quiz submission' }, { status: 500 });
  }
}
