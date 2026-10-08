import type {
  ClassDefinition,
  ItemDefinition,
  MapDefinition,
  MonsterDefinition,
  SkillDefinition,
} from '@ragidle/shared';
import { classes } from './classes';
import { items } from './items';
import { maps } from './maps';
import { monsters } from './monsters';
import { skills } from './skills';

export interface GameData {
  classes: Record<string, ClassDefinition>;
  skills: Record<string, SkillDefinition>;
  items: Record<string, ItemDefinition>;
  monsters: Record<string, MonsterDefinition>;
  maps: Record<string, MapDefinition>;
}

export const gameData: GameData = { classes, skills, items, monsters, maps };

function lookup<T>(table: Record<string, T>, kind: string, id: string): T {
  const value = table[id];
  if (!value) throw new Error(`Unknown ${kind}: ${id}`);
  return value;
}

export const getClass = (id: string, data: GameData = gameData) =>
  lookup(data.classes, 'class', id);
export const getSkill = (id: string, data: GameData = gameData) => lookup(data.skills, 'skill', id);
export const getItem = (id: string, data: GameData = gameData) => lookup(data.items, 'item', id);
export const getMonster = (id: string, data: GameData = gameData) =>
  lookup(data.monsters, 'monster', id);
export const getMap = (id: string, data: GameData = gameData) => lookup(data.maps, 'map', id);
