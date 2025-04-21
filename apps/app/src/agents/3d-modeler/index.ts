import { generateObject } from 'ai'
import { prompt } from './prompt'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createXai } from '@ai-sdk/xai'
import { AnthropicService } from '@/lib/services/anthropic-service'
import { z } from 'zod'

const meshSchema = z.object({
  id: z.string(),
  vertices: z.array(z.object({
    id: z.string(),
    position: z.array(z.number()),
    halfEdge: z.string().nullable()
  })).describe("You must return an array of vertices"),
  halfEdges: z.array(z.object({
    id: z.string(),
    vertex: z.string(),
    pair: z.string().nullable(),
    face: z.string(),
    next: z.string(),
    prev: z.string()
  })).describe("You must return an array of half edges"),
  faces: z.array(z.object({
    id: z.string(),
    halfEdge: z.string()
  })).describe("You must return an array of faces"),
  modifiers: z.array(z.string()).describe("You must return an empty array")
})

export const modelerAgent = async (request: Request) => {
  const { prompt: userPrompt } = await request.json()
  const anthropicApiKey = await AnthropicService.getApiKey()
  if (!anthropicApiKey) throw new Error('Anthropic API key not found')
  const anthropic = createAnthropic({ apiKey: anthropicApiKey })
  // const xai = createXai({ apiKey: process.env.XAI_API_KEY })
  const { object } = await generateObject({
    model: anthropic('claude-3-7-sonnet-20250219'),
    schema: meshSchema,
    system: prompt,
    prompt: userPrompt
  })
  return Response.json(object)
} 