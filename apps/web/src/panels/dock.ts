import type { ComponentType } from 'react';
import type { DockTab } from '../stores/ui-store';
import { AutomationPanel } from './AutomationPanel';
import { BagPanel } from './BagPanel';
import { CharacterPanel } from './CharacterPanel';

/** Dock tabs, grouped by what the player wants to do. Shortcuts follow the RO client. */
export const DOCK_TABS: {
  id: DockTab;
  label: string;
  hotkey: string;
  Panel: ComponentType;
}[] = [
  { id: 'automation', label: 'Automation', hotkey: 'Alt+R', Panel: AutomationPanel },
  { id: 'bag', label: 'Bag', hotkey: 'Alt+E', Panel: BagPanel },
  { id: 'character', label: 'Character', hotkey: 'Alt+A', Panel: CharacterPanel },
];
