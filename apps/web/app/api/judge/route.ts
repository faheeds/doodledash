import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { prompt, svgData, playerUsername } = await req.json();
    if (!prompt || !svgData) {
      return NextResponse.json({ error: 'Missing prompt or svgData' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are the AI judge for Doodle Dash, a drawing game for kids ages 8-13.

The prompt was: "${prompt}"
The player is: ${playerUsername || 'a kid'}

Here is their drawing as SVG data:
${svgData.slice(0, 3000)}

Judge this drawing on THREE things:
1. CREATIVITY (0-40 pts): Did they interpret the prompt in a surprising, funny, or imaginative way?
2. PERSONALITY (0-40 pts): Does the drawing have a distinct voice or visual style, even if the skill level is basic?
3. PROMPT MATCH (0-20 pts): Did they actually attempt to draw what was asked?

IMPORTANT RULES:
- Skill and artistic quality do NOT matter. A stick figure can score 100/100.
- Reward weird, funny, unexpected interpretations.
- Be encouraging and playful — this is for kids.
- Keep your feedback to ONE short, fun sentence (max 12 words).

Respond in this exact JSON format:
{"score": <number 0-100>, "feedback": "<one fun sentence>", "breakdown": {"creativity": <0-40>, "personality": <0-40>, "promptMatch": <0-20>}}`
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Judge error:', err);
    return NextResponse.json({ score: 75, feedback: 'Love the creative energy!', breakdown: { creativity: 30, personality: 30, promptMatch: 15 } });
  }
}
