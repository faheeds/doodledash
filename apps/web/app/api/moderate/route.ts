import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { svgData, prompt } = await req.json();
    if (!svgData) return NextResponse.json({ safe: true });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `You are a content moderator for a children's drawing game (ages 8-13).

The drawing prompt was: "${prompt}"
SVG drawing data: ${svgData.slice(0, 1000)}

Is this drawing safe for children? Look for any SVG elements suggesting violence, adult content, or hate symbols.
Most drawings will be safe. Only flag clearly inappropriate content.

Reply with JSON only: {"safe": true} or {"safe": false, "reason": "brief reason"}`
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '{"safe": true}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { safe: true };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ safe: true });
  }
}
