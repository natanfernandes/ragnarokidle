import { z } from 'zod';

const percentSchema = z.number().min(0).max(100);
const idSchema = z.string().min(1).max(64);

export const itemCategorySchema = z.enum([
  'consumable',
  'material',
  'equipment',
  'card',
  'currency',
  'quest',
]);

export const combatConfigSchema = z.object({
  targetMode: z.enum(['nearest', 'lowest_hp', 'highest_xp', 'specific']),
  targetMonsterId: idSchema.optional(),
  skills: z
    .array(
      z.object({
        skillId: idSchema,
        enabled: z.boolean(),
        priority: z.number().int().min(0).max(100),
        conditions: z
          .object({
            minHpPercent: percentSchema.optional(),
            maxHpPercent: percentSchema.optional(),
            minSpPercent: percentSchema.optional(),
            minTargets: z.number().int().min(1).max(20).optional(),
          })
          .optional(),
      }),
    )
    .max(20),
  potions: z.object({
    hp: z.object({ itemId: idSchema, enabled: z.boolean(), belowPercent: percentSchema }),
    sp: z.object({ itemId: idSchema, enabled: z.boolean(), belowPercent: percentSchema }),
  }),
  loot: z.object({
    pickupCategories: z.array(itemCategorySchema).max(10),
    alwaysPickup: z.array(idSchema).max(200),
    ignore: z.array(idSchema).max(200),
  }),
});

const requestId = z.string().max(64).optional();

export const clientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('state.request'), requestId }),
  z.object({ type: z.literal('combat.start'), mapId: idSchema, requestId }),
  z.object({ type: z.literal('combat.stop'), requestId }),
  z.object({ type: z.literal('combat.config.update'), config: combatConfigSchema, requestId }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;
export type ClientMessageType = ClientMessage['type'];

export type ParseResult = { ok: true; message: ClientMessage } | { ok: false; error: string };

/** Parses and validates a raw WebSocket payload sent by a client. */
export function parseClientMessage(raw: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Message is not valid JSON' };
  }
  const result = clientMessageSchema.safeParse(json);
  if (!result.success) return { ok: false, error: z.prettifyError(result.error) };
  return { ok: true, message: result.data };
}
