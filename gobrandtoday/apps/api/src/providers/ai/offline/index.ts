import type { AIProvider, AssistantInput, AssistantOutput, KitDraft, KitGenInput, NameGenInput, RawName } from '../types';
import { offlineAssistant } from './assistant';
import { generateOfflineKit } from './kit';
import { generateOfflineNames } from './names';

/** No network, no key — deterministic and fast. Labelled "offline" everywhere. */
export class OfflineProvider implements AIProvider {
  readonly id = 'offline' as const;
  readonly live = false;
  async generateNames(input: NameGenInput): Promise<RawName[]> {
    return generateOfflineNames(input);
  }
  async generateKit(input: KitGenInput): Promise<Partial<KitDraft>> {
    return generateOfflineKit(input);
  }
  async assistant(input: AssistantInput): Promise<AssistantOutput> {
    return offlineAssistant(input);
  }
}
