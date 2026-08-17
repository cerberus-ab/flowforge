import type {
    BoundingBox,
    InteractiveElementLabel,
    InteractiveElementRole,
    InteractiveElementState,
    InteractiveElementType,
} from '../../../types/index.ts';
import { normalizeText } from '../../../utils/index.ts';
import { ScoringFeat, type ScoringResult } from '../ScoringFeat.ts';

const SMALL_INTERACTIVE_AREA = 24 * 24;

const scoringWeights = {
    type: {
        // Buttons and inputs usually represent direct user intent.
        action: 3,
        input: 3,
        // Selection controls are meaningful, but often need nearby labels/options for grounding.
        selection: 2,
        // Links are meaningful targets, but their importance is usually context-dependent.
        navigation: 1,
    },
    role: {
        // Primary controls and free-text inputs are high-value standalone targets.
        critical: 3,
        // Selection/list controls are part of user flows.
        userFlow: 2,
        // Toggle/range controls represent explicit state changes.
        stateControl: 2,
        // Navigation roles are useful, but less action-critical by themselves.
        navigation: 1,
        // Supporting interactive roles can still be useful, but need context.
        supporting: 1,
    },
    name: {
        // Explicit labels usually provide the strongest local meaning.
        strong: 3,
        // Visible text is useful, but can be less reliable than explicit labels.
        textOnly: 2,
        // Unnamed interactive elements are hard to understand and ground.
        missing: -3,
    },
    usability: {
        // Usable targets are available to the user.
        usable: 1,
        // Read-only controls can be meaningful but are not direct action targets.
        readonly: -1,
        // Hidden or disabled controls are not currently actionable.
        notUsable: -6,
    },
    // Required controls often carry more form/task meaning.
    required: 1,
    // Very small targets are often icons, decoration, or hard-to-ground controls.
    sizeTooSmall: -2,
} as const;

const scoringFeat = ScoringFeat.create(scoringWeights);

function readTypeScoringCategory(type: InteractiveElementType): keyof typeof scoringWeights.type {
    if (type === 'button') return 'action';
    if (type === 'input') return 'input';
    if (type === 'select') return 'selection';
    return 'navigation';
}

function readRoleScoringCategory(role: InteractiveElementRole): keyof typeof scoringWeights.role {
    if (role === 'button' || role === 'textbox' || role === 'searchbox') {
        return 'critical';
    }
    if (role === 'combobox' || role === 'listbox' || role === 'option') {
        return 'userFlow';
    }
    if (role === 'checkbox' || role === 'radio' || role === 'switch' || role === 'slider') {
        return 'stateControl';
    }
    if (role === 'link' || role === 'tab' || role === 'menuitem') {
        return 'navigation';
    }
    return 'supporting';
}

function readNameScoringCategory(
    labels: InteractiveElementLabel[],
    text: string | undefined,
): keyof typeof scoringWeights.name {
    if (labels.length > 0) return 'strong';
    if (normalizeText(text ?? '').length > 0) return 'textOnly';
    return 'missing';
}

function readUsabilityScoringCategory(state: InteractiveElementState): keyof typeof scoringWeights.usability {
    if (state.hidden || state.disabled) return 'notUsable';
    if (state.readonly) return 'readonly';
    return 'usable';
}

// Exports

export interface InteractiveMeaningScoringData {
    role: InteractiveElementRole;
    type: InteractiveElementType;
    labels: InteractiveElementLabel[];
    text: string | undefined;
    state: InteractiveElementState;
    bbox: BoundingBox;
}

export function scoreInteractiveMeaning(scoringData: InteractiveMeaningScoringData): ScoringResult {
    const { role, type, labels, text, state, bbox } = scoringData;

    return scoringFeat.calc({
        type: readTypeScoringCategory(type),
        role: readRoleScoringCategory(role),
        name: readNameScoringCategory(labels, text),
        usability: readUsabilityScoringCategory(state),
        required: state.required,
        sizeTooSmall: bbox.width * bbox.height < SMALL_INTERACTIVE_AREA,
    });
}
