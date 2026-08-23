import type {
    BoundingBox,
    InteractiveElementLabel,
    InteractiveElementRole,
    InteractiveElementState,
    InteractiveElementType,
} from '../../../types/index.ts';
import { ScoringFeat, type ScoringResult } from '../ScoringFeat.ts';

// constants
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
        // Concise labels usually provide the strongest local meaning.
        strong: 3,
        // Valid but longer labels still provide explicit naming signal.
        weak: 2,
        // Visible text can name the target, but is less reliable than an explicit label.
        textOnly: 1,
        // Long visible text is often wrapper/card content rather than a precise target name.
        noisyText: -1,
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
    if (labels.some((label) => label.value.length >= 5 && label.value.length <= 80)) {
        return 'strong';
    }
    if (labels.some((label) => label.value.length >= 5)) {
        return 'weak';
    }
    if (text !== undefined) {
        if (text.length > 160) return 'noisyText';
        if (text.length >= 5) return 'textOnly';
    }
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
